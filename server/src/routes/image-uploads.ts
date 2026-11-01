import { Router, raw } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const imageUploadsRouter = Router();

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function matchesImageSignature(image: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") return image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  if (contentType === "image/png") return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return image.length >= 12
    && image.toString("ascii", 0, 4) === "RIFF"
    && image.toString("ascii", 8, 12) === "WEBP";
}

imageUploadsRouter.post(
  "/uploads/images",
  requireAuth,
  raw({ type: [...acceptedTypes], limit: "8mb" }),
  async (request, response, next) => {
    try {
      const contentType = request.header("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
      if (!env.imgbbApiKey) {
        response.status(503).json({ status: "error", message: "Image uploads are not configured on the server yet." });
        return;
      }
      if (!acceptedTypes.has(contentType) || !Buffer.isBuffer(request.body) || request.body.length === 0) {
        response.status(400).json({ status: "error", message: "Choose a JPEG, PNG, or WebP image." });
        return;
      }
      if (!matchesImageSignature(request.body, contentType)) {
        response.status(400).json({ status: "error", message: "The selected file does not match its image type." });
        return;
      }

      const form = new FormData();
      form.set("image", request.body.toString("base64"));
      const uploadUrl = new URL("https://api.imgbb.com/1/upload");
      uploadUrl.searchParams.set("key", env.imgbbApiKey);
      const upload = await fetch(uploadUrl, { method: "POST", body: form });
      const result = await upload.json() as {
        success?: boolean;
        data?: { display_url?: string; url?: string };
      };
      const url = result.data?.display_url ?? result.data?.url;
      if (!upload.ok || !result.success || !url || !URL.canParse(url)) {
        response.status(502).json({ status: "error", message: "The image could not be uploaded. Try another image." });
        return;
      }

      response.status(201).json({ url });
    } catch (error) {
      next(error);
    }
  },
);
