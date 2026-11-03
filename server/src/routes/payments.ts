import { randomBytes } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { notifyInBackground } from "../lib/email.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Booking } from "../models/Booking.js";
import { Studio } from "../models/Studio.js";

export const paymentsRouter = Router();
const bookingIdPattern = /^[a-f\d]{24}$/i;

function gatewayOrigin(): string {
  return env.sslCommerzSandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
}

function clientResultUrl(status: string, bookingId?: string): string {
  const url = new URL("/my-bookings", env.clientOrigin);
  url.searchParams.set("payment", status);
  if (bookingId) url.searchParams.set("booking", bookingId);
  return url.toString();
}

function callbackUrl(name: "success" | "fail" | "cancel" | "ipn"): string {
  return `${env.publicApiUrl}/api/payments/sslcommerz/${name}`;
}

type PaymentNotice = Record<string, unknown>;

async function validateAndMarkPaid(notice: PaymentNotice): Promise<{ ok: boolean; bookingId?: string }> {
  const tranId = typeof notice.tran_id === "string" ? notice.tran_id : "";
  const validationId = typeof notice.val_id === "string" ? notice.val_id : "";
  if (!tranId || !validationId || !["VALID", "SUCCESS"].includes(String(notice.status))) return { ok: false };

  const database = await connectDatabase();
  if (!database || !env.sslCommerzStoreId || !env.sslCommerzStorePassword) return { ok: false };
  const booking = await Booking.findOne({ paymentTransactionId: tranId }).lean();
  if (!booking) return { ok: false };
  if (booking.paymentStatus === "paid") return { ok: true, bookingId: String(booking._id) };
  if (booking.status !== "Confirmed" || !["pending", "failed", "cancelled"].includes(booking.paymentStatus ?? "unpaid")) return { ok: false };

  const validatorUrl = new URL(`${gatewayOrigin()}/validator/api/validationserverAPI.php`);
  validatorUrl.searchParams.set("val_id", validationId);
  validatorUrl.searchParams.set("store_id", env.sslCommerzStoreId);
  validatorUrl.searchParams.set("store_passwd", env.sslCommerzStorePassword);
  validatorUrl.searchParams.set("format", "json");

  let validation: Record<string, unknown>;
  try {
    const response = await fetch(validatorUrl, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
    if (!response.ok) return { ok: false };
    validation = await response.json() as Record<string, unknown>;
  } catch {
    return { ok: false };
  }

  const expectedAmount = Number(booking.totalPrice);
  const reportedAmount = Number(validation.currency_amount);
  const currencyMatches = validation.currency_type === (booking.paymentCurrency ?? "USD");
  const amountMatches = Number.isFinite(reportedAmount)
    && Math.round(reportedAmount * 100) === Math.round(expectedAmount * 100);
  if (!(["VALID", "VALIDATED"].includes(String(validation.status))) || validation.tran_id !== tranId) {
    return { ok: false };
  }

  if (!currencyMatches || !amountMatches || Number(validation.risk_level ?? 0) !== 0) {
    await Booking.updateOne(
      { _id: booking._id, paymentTransactionId: tranId, paymentStatus: { $in: ["pending", "failed", "cancelled"] } },
      { $set: { paymentStatus: "review", paymentValidationId: validationId }, $unset: { paymentGatewayUrl: "" } },
    );
    return { ok: false, bookingId: String(booking._id) };
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: "Confirmed", paymentStatus: { $in: ["pending", "failed", "cancelled"] }, paymentTransactionId: tranId },
    { $set: { paymentStatus: "paid", paymentValidationId: validationId, paidAt: new Date() }, $unset: { paymentGatewayUrl: "" } },
    { new: true },
  ).lean();
  if (!updated) {
    const current = await Booking.findById(booking._id).select("paymentStatus paymentTransactionId").lean();
    return current?.paymentStatus === "paid" && current.paymentTransactionId === tranId
      ? { ok: true, bookingId: String(booking._id) }
      : { ok: false };
  }

  if (updated.customerEmail) {
    notifyInBackground({
      to: updated.customerEmail,
      subject: `Payment received: ${updated.studioTitle}`,
      text: `Your StudioSpace rental payment of ${updated.totalPrice.toFixed(2)} USD for ${updated.studioTitle} has been validated and recorded as paid.`,
    });
  }
  const studio = await Studio.findById(updated.studioId).select("ownerEmail").lean();
  if (studio?.ownerEmail) {
    notifyInBackground({
      to: studio.ownerEmail,
      subject: `Booking paid: ${updated.studioTitle}`,
      text: `The customer payment for ${updated.studioTitle} on ${updated.bookingDate} has been validated and recorded as paid.`,
    });
  }
  return { ok: true, bookingId: String(updated._id) };
}

paymentsRouter.post("/payments/sslcommerz/initiate", requireAuth, async (request, response, next) => {
  try {
    const id = request.body?.bookingId;
    if (typeof id !== "string" || !bookingIdPattern.test(id)) {
      response.status(400).json({ status: "error", message: "Choose a valid confirmed booking." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Payments are temporarily unavailable." });
      return;
    }
    if (!env.sslCommerzStoreId || !env.sslCommerzStorePassword) {
      response.status(503).json({ status: "error", message: "SSLCommerz is not configured yet. Add the store credentials to the API environment." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const booking = await Booking.findOne({ _id: new mongoose.Types.ObjectId(id), userId: session.user.id, status: "Confirmed" }).lean();
    if (!booking) {
      response.status(404).json({ status: "error", message: "Only your confirmed bookings can be paid." });
      return;
    }
    if (booking.paymentStatus === "paid") {
      response.status(409).json({ status: "error", message: "This booking is already paid." });
      return;
    }
    if (booking.paymentStatus === "review") {
      response.status(409).json({ status: "error", message: "This transaction is held for payment review. Contact StudioSpace support before paying again." });
      return;
    }
    if (booking.paymentStatus === "pending") {
      if (booking.paymentGatewayUrl) {
        response.json({ gatewayUrl: booking.paymentGatewayUrl });
        return;
      }
      response.status(409).json({ status: "error", message: "This payment is still being prepared. Refresh your bookings and try again shortly." });
      return;
    }
    if (!Number.isFinite(booking.totalPrice) || booking.totalPrice <= 0) {
      response.status(400).json({ status: "error", message: "This booking does not have a payable rental total." });
      return;
    }

    const transactionId = `SP${String(booking._id)}${randomBytes(3).toString("base64url").slice(0, 4).toUpperCase()}`;
    const updated = await Booking.updateOne(
      { _id: booking._id, userId: session.user.id, status: "Confirmed", paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "pending", paymentProvider: "sslcommerz", paymentCurrency: "USD", paymentTransactionId: transactionId }, $unset: { paymentGatewayUrl: "", paymentValidationId: "" } },
    );
    if (updated.modifiedCount !== 1) {
      response.status(409).json({ status: "error", message: "The payment state changed. Refresh your bookings and try again." });
      return;
    }

    const payload = new URLSearchParams({
      store_id: env.sslCommerzStoreId,
      store_passwd: env.sslCommerzStorePassword,
      total_amount: booking.totalPrice.toFixed(2),
      currency: "USD",
      tran_id: transactionId,
      success_url: callbackUrl("success"),
      fail_url: callbackUrl("fail"),
      cancel_url: callbackUrl("cancel"),
      ipn_url: callbackUrl("ipn"),
      cus_name: booking.customerName || "StudioSpace customer",
      cus_email: booking.customerEmail || "customer@example.com",
      cus_phone: booking.customerPhone || "",
      cus_add1: booking.studioLocation.slice(0, 50),
      cus_city: booking.studioLocation.split(",").at(-1)?.trim().slice(0, 50) || "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      product_name: booking.studioTitle.slice(0, 200),
      product_category: "Creative studio booking",
      product_profile: "non-physical-goods",
      value_a: String(booking._id),
    });

    let gatewayResponse: Record<string, unknown>;
    try {
      const gateway = await fetch(`${gatewayOrigin()}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: payload,
        signal: AbortSignal.timeout(15_000),
      });
      if (!gateway.ok) throw new Error("Payment gateway request failed.");
      gatewayResponse = await gateway.json() as Record<string, unknown>;
    } catch {
      await Booking.updateOne({ _id: booking._id, paymentTransactionId: transactionId, paymentStatus: "pending" }, { $set: { paymentStatus: "failed" }, $unset: { paymentGatewayUrl: "" } });
      response.status(502).json({ status: "error", message: "Could not connect to SSLCommerz. Please try again." });
      return;
    }

    const gatewayPageUrl = typeof gatewayResponse.GatewayPageURL === "string" ? gatewayResponse.GatewayPageURL : "";
    let parsedGatewayUrl: URL | null = null;
    try { parsedGatewayUrl = new URL(gatewayPageUrl); } catch { parsedGatewayUrl = null; }
    const expectedGatewayHost = env.sslCommerzSandbox ? "sandbox.sslcommerz.com" : "securepay.sslcommerz.com";
    if (!parsedGatewayUrl || parsedGatewayUrl.protocol !== "https:" || parsedGatewayUrl.hostname !== expectedGatewayHost) {
      await Booking.updateOne({ _id: booking._id, paymentTransactionId: transactionId, paymentStatus: "pending" }, { $set: { paymentStatus: "failed" }, $unset: { paymentGatewayUrl: "" } });
      response.status(502).json({ status: "error", message: "SSLCommerz did not return a valid checkout page." });
      return;
    }
    await Booking.updateOne({ _id: booking._id, paymentTransactionId: transactionId, paymentStatus: "pending" }, { $set: { paymentGatewayUrl: parsedGatewayUrl.toString() } });
    response.json({ gatewayUrl: parsedGatewayUrl.toString() });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/payments/sslcommerz/success", async (request, response, next) => {
  try {
    const result = await validateAndMarkPaid(request.body as PaymentNotice);
    response.redirect(303, clientResultUrl(result.ok ? "success" : "verification-required", result.bookingId));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/payments/sslcommerz/ipn", async (request, response, next) => {
  try {
    const result = await validateAndMarkPaid(request.body as PaymentNotice);
    response.status(result.ok ? 200 : 400).type("text/plain").send(result.ok ? "VALID" : "INVALID");
  } catch (error) {
    next(error);
  }
});

for (const status of ["fail", "cancel"] as const) {
  paymentsRouter.post(`/payments/sslcommerz/${status}`, async (request, response, next) => {
    try {
      const transactionId = typeof request.body?.tran_id === "string" ? request.body.tran_id : "";
      const booking = transactionId ? await Booking.findOneAndUpdate(
        { paymentTransactionId: transactionId, paymentStatus: "pending" },
        { $set: { paymentStatus: status === "fail" ? "failed" : "cancelled" }, $unset: { paymentGatewayUrl: "" } },
        { new: true },
      ).select("_id").lean() : null;
      const fallback = typeof request.body?.value_a === "string" && bookingIdPattern.test(request.body.value_a) ? request.body.value_a : undefined;
      const id = booking ? String(booking._id) : fallback;
      const paid = id && transactionId ? await Booking.exists({ _id: id, paymentTransactionId: transactionId, paymentStatus: "paid" }) : null;
      response.redirect(303, clientResultUrl(paid ? "success" : status === "fail" ? "failed" : "cancelled", id));
    } catch (error) {
      next(error);
    }
  });
}
