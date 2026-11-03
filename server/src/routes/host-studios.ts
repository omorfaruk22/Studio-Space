import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Studio } from "../models/Studio.js";

export const hostStudiosRouter = Router();

const categories = ["photo", "sound-stage", "podcast", "music", "art"] as const;
const maxImages = 10;
const maxAmenities = 20;

export type StudioInput = {
  title: string;
  category: (typeof categories)[number];
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  image: string;
  images: string[];
  amenities: string[];
  overview: string;
};

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function imageUrl(value: unknown): string | null {
  const url = text(value, 2048);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseStudioInput(value: unknown): { input?: StudioInput; message?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { message: "Enter the studio details and try again." };
  }

  const body = value as Record<string, unknown>;
  const title = text(body.title, 120);
  const category = body.category;
  const hourlyRate = nonNegativeNumber(body.hourlyRate);
  const securityDeposit = nonNegativeNumber(body.securityDeposit);
  const maxCapacity = body.maxCapacity;
  const location = text(body.location, 180);
  const image = imageUrl(body.image);
  const overview = text(body.overview, 5000);

  if (!title) return { message: "Studio name is required (up to 120 characters)." };
  if (typeof category !== "string" || !categories.includes(category as (typeof categories)[number])) {
    return { message: "Choose a valid studio category." };
  }
  if (hourlyRate === null) return { message: "Enter a valid hourly rate." };
  if (securityDeposit === null) return { message: "Enter a valid security deposit." };
  if (typeof maxCapacity !== "number" || !Number.isInteger(maxCapacity) || maxCapacity < 1) {
    return { message: "Maximum capacity must be a whole number of at least 1." };
  }
  if (!location) return { message: "Location is required (up to 180 characters)." };
  if (!image) return { message: "Enter a valid studio image URL." };
  if (!overview) return { message: "Add a studio description (up to 5,000 characters)." };

  const imagesValue = body.images ?? [];
  if (!Array.isArray(imagesValue) || imagesValue.length > maxImages) {
    return { message: `Add no more than ${maxImages} gallery image URLs.` };
  }
  const images = imagesValue.map(imageUrl);
  if (images.some((url) => url === null)) return { message: "One of the gallery image URLs is invalid." };

  const amenitiesValue = body.amenities ?? [];
  if (!Array.isArray(amenitiesValue) || amenitiesValue.length > maxAmenities) {
    return { message: `Add no more than ${maxAmenities} amenities.` };
  }
  const amenities = amenitiesValue.map((item) => text(item, 60));
  if (amenities.some((item) => item === null)) return { message: "Each amenity must be 1–60 characters." };

  return {
    input: {
      title,
      category: category as StudioInput["category"],
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      images: images as string[],
      amenities: [...new Set(amenities as string[])],
      overview,
    },
  };
}

export function serializeStudio(studio: {
  _id: unknown;
  title: string;
  category: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  image: string;
  images: string[];
  amenities: string[];
  overview: string;
  isAvailable: boolean;
  moderationStatus?: string;
  moderationNote?: string;
  ownerName: string;
  ownerEmail: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(studio._id),
    title: studio.title,
    category: studio.category,
    hourlyRate: studio.hourlyRate,
    securityDeposit: studio.securityDeposit,
    maxCapacity: studio.maxCapacity,
    location: studio.location,
    image: studio.image,
    images: studio.images ?? [],
    amenities: studio.amenities ?? [],
    overview: studio.overview,
    isAvailable: studio.isAvailable,
    moderationStatus: studio.moderationStatus ?? "approved",
    moderationNote: studio.moderationNote ?? "",
    ownerName: studio.ownerName,
    ownerEmail: studio.ownerEmail,
    createdAt: studio.createdAt?.toISOString(),
    updatedAt: studio.updatedAt?.toISOString(),
  };
}

function validId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

// This router shares the /api mount with public studio routes.
hostStudiosRouter.use("/host/studios", requireAuth);

hostStudiosRouter.get("/host/studios", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studios = await Studio.find({ ownerId: session.user.id }).sort({ createdAt: -1 }).lean();
    response.json({ studios: studios.map(serializeStudio) });
  } catch (error) {
    next(error);
  }
});

hostStudiosRouter.post("/host/studios", async (request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const parsed = parseStudioInput(request.body);
    if (!parsed.input) {
      response.status(400).json({ status: "error", message: parsed.message });
      return;
    }

    const session = response.locals.authSession as {
      user: { id: string; name: string; email: string };
    };
    const studio = await Studio.create({
      ...parsed.input,
      ownerId: session.user.id,
      ownerName: session.user.name,
      ownerEmail: session.user.email,
      moderationStatus: "pending",
      isAvailable: true,
    });

    response.status(201).json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

hostStudiosRouter.get("/host/studios/:id", async (request, response, next) => {
  try {
    if (!validId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studio = await Studio.findOne({ _id: request.params.id, ownerId: session.user.id }).lean();
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

hostStudiosRouter.patch("/host/studios/:id", async (request, response, next) => {
  try {
    if (!validId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const parsed = parseStudioInput(request.body);
    if (!parsed.input) {
      response.status(400).json({ status: "error", message: parsed.message });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studio = await Studio.findOneAndUpdate(
      { _id: request.params.id, ownerId: session.user.id },
      { $set: { ...parsed.input, moderationStatus: "pending", moderationNote: "" } },
      { new: true, runValidators: true },
    ).lean();

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

hostStudiosRouter.patch("/host/studios/:id/availability", async (request, response, next) => {
  try {
    if (!validId(request.params.id) || typeof request.body?.isAvailable !== "boolean") {
      response.status(400).json({ status: "error", message: "Choose whether this studio is available." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studio = await Studio.findOneAndUpdate(
      { _id: request.params.id, ownerId: session.user.id },
      { $set: { isAvailable: request.body.isAvailable } },
      { new: true, runValidators: true },
    ).lean();

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

hostStudiosRouter.delete("/host/studios/:id", async (request, response, next) => {
  try {
    if (!validId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studio = await Studio.findOneAndDelete({ _id: request.params.id, ownerId: session.user.id });

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ message: "Studio listing deleted." });
  } catch (error) {
    next(error);
  }
});
