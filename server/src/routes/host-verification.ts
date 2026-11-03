import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { HostVerification } from "../models/HostVerification.js";

export const hostVerificationRouter = Router();
hostVerificationRouter.use("/host/verification", requireAuth);

hostVerificationRouter.get("/host/verification", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Host verification is temporarily unavailable." });
      return;
    }
    const session = response.locals.authSession as { user: { id: string } };
    const request = await HostVerification.findOne({ userId: session.user.id }).lean();
    response.setHeader("cache-control", "no-store");
    response.json({ verification: request ? {
      id: String(request._id),
      status: request.status,
      businessName: request.businessName,
      website: request.website,
      message: request.message,
      adminNote: request.adminNote,
      createdAt: request.createdAt?.toISOString(),
    } : null });
  } catch (error) {
    next(error);
  }
});

hostVerificationRouter.post("/host/verification", async (request, response, next) => {
  try {
    const businessName = typeof request.body?.businessName === "string" ? request.body.businessName.trim() : "";
    const website = typeof request.body?.website === "string" ? request.body.website.trim() : "";
    const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
    if (businessName.length > 120 || message.length < 30 || message.length > 1200) {
      response.status(400).json({ status: "error", message: "Add a business name under 120 characters and a message of 30–1,200 characters." });
      return;
    }
    if (website) {
      try {
        const url = new URL(website);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
      } catch {
        response.status(400).json({ status: "error", message: "Enter a valid public website URL or leave it blank." });
        return;
      }
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Host verification is temporarily unavailable." });
      return;
    }
    const session = response.locals.authSession as { user: { id: string; name: string; email: string } };
    const existing = await HostVerification.findOne({ userId: session.user.id }).select("status").lean();
    if (existing?.status === "approved") {
      response.status(409).json({ status: "error", message: "This host account is already verified." });
      return;
    }
    const verification = await HostVerification.findOneAndUpdate(
      { userId: session.user.id },
      { $set: {
        name: session.user.name,
        email: session.user.email,
        businessName,
        website,
        message,
        status: "pending",
        adminNote: "",
        reviewedBy: "",
        reviewedAt: null,
      } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    response.status(200).json({ verification: {
      id: String(verification!._id),
      status: verification!.status,
      businessName: verification!.businessName,
      website: verification!.website,
      message: verification!.message,
      adminNote: verification!.adminNote,
      createdAt: verification!.createdAt?.toISOString(),
    } });
  } catch (error) {
    next(error);
  }
});
