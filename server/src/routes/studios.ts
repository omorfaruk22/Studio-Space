import { Router } from "express";
import type { FilterQuery, SortOrder } from "mongoose";
import { connectDatabase } from "../config/database.js";
import { publicStudioFilter } from "../lib/studio-visibility.js";
import { Booking } from "../models/Booking.js";
import { Studio, type StudioRecord } from "../models/Studio.js";

export const studiosRouter = Router();

const categories = ["photo", "sound-stage", "podcast", "music", "art"] as const;
const sortOptions: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  price: { hourlyRate: 1, createdAt: -1 },
  rating: { rating: -1, createdAt: -1 },
};

function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function safeRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function parsePrice(value: unknown): number | undefined | null {
  const text = queryString(value);
  if (text === undefined || text === "") return undefined;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toSummary(studio: {
  _id: unknown;
  title: string;
  category: string;
  hourlyRate: number;
  location: string;
  image: string;
  rating: number;
  maxCapacity: number;
  amenities?: string[];
  createdAt?: Date;
}) {
  return {
    id: String(studio._id),
    title: studio.title,
    category: studio.category,
    hourlyRate: studio.hourlyRate,
    location: studio.location,
    image: studio.image,
    rating: studio.rating,
    maxCapacity: studio.maxCapacity,
    amenities: studio.amenities ?? [],
    createdAt: studio.createdAt?.toISOString(),
  };
}

studiosRouter.get("/studios/:id/availability", async (request, response, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(request.params.id) || !validDate(request.query.date)) {
      response.status(400).json({ status: "error", message: "Choose a valid studio and date." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio availability is temporarily unavailable." });
      return;
    }
    const studio = await Studio.exists({ _id: request.params.id, ...publicStudioFilter });
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio is not available." });
      return;
    }
    const bookings = await Booking.find({ studioId: request.params.id, bookingDate: request.query.date, status: "Confirmed" })
      .select("startTime endTime")
      .sort({ startTime: 1 })
      .lean();
    response.setHeader("cache-control", "no-store");
    response.json({ date: request.query.date, booked: bookings.map(({ startTime, endTime }) => ({ startTime, endTime })) });
  } catch (error) {
    next(error);
  }
});

studiosRouter.get("/studios/featured", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio listings are temporarily unavailable." });
      return;
    }

    const studios = await Studio.find(publicStudioFilter)
      .select("title category hourlyRate location image rating maxCapacity amenities createdAt")
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .lean();

    response.json({
      studios: studios.map((studio) => ({
        id: String(studio._id),
        title: studio.title,
        category: studio.category,
        hourlyRate: studio.hourlyRate,
        location: studio.location,
        image: studio.image,
        rating: studio.rating,
        maxCapacity: studio.maxCapacity,
      })),
    });
  } catch (error) {
    next(error);
  }
});
studiosRouter.get("/studios", async (request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio listings are temporarily unavailable." });
      return;
    }

    const category = queryString(request.query.category);
    if (category && !categories.includes(category as (typeof categories)[number])) {
      response.status(400).json({ status: "error", message: "Choose a valid studio category." });
      return;
    }

    const minPrice = parsePrice(request.query.minPrice);
    const maxPrice = parsePrice(request.query.maxPrice);
    if (minPrice === null || maxPrice === null || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      response.status(400).json({ status: "error", message: "Enter a valid hourly price range." });
      return;
    }

    const search = queryString(request.query.search);
    const location = queryString(request.query.location);
    const minCapacity = parsePrice(request.query.minCapacity);
    const amenity = queryString(request.query.amenity);
    if ((minCapacity !== undefined && minCapacity === null) || (minCapacity !== undefined && !Number.isInteger(minCapacity))) {
      response.status(400).json({ status: "error", message: "Enter a valid minimum capacity." });
      return;
    }
    const sort = queryString(request.query.sort) ?? "newest";
    if (!sortOptions[sort]) {
      response.status(400).json({ status: "error", message: "Choose a valid studio sort order." });
      return;
    }

    const filter: FilterQuery<StudioRecord> = { ...publicStudioFilter };
    if (category) filter.category = category;
    if (search) filter.title = safeRegex(search.slice(0, 100));
    if (location) filter.location = safeRegex(location.slice(0, 100));
    if (minCapacity !== undefined) filter.maxCapacity = { $gte: minCapacity };
    if (amenity) filter.amenities = safeRegex(amenity.slice(0, 60));
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.hourlyRate = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    const studios = await Studio.find(filter)
      .select("title category hourlyRate location image rating maxCapacity amenities createdAt")
      .sort(sortOptions[sort])
      .lean();

    response.json({ studios: studios.map(toSummary), total: studios.length });
  } catch (error) {
    next(error);
  }
});

