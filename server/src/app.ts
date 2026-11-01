import cors from "cors";
import express from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { accountRouter } from "./routes/account.js";
import { bookingsRouter } from "./routes/bookings.js";
import { healthRouter } from "./routes/health.js";
import { hostStudiosRouter } from "./routes/host-studios.js";
import { imageUploadsRouter } from "./routes/image-uploads.js";
import { newsletterRouter } from "./routes/newsletter.js";
import { savedStudiosRouter } from "./routes/saved-studios.js";
import { studioDetailsRouter } from "./routes/studio-details.js";
import { studiosRouter } from "./routes/studios.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));

app.get("/api/auth/config", (_request, response) => {
  response.json({ googleEnabled: Boolean(env.googleClientId && env.googleClientSecret) });
});

// Better Auth must receive the raw request before express.json consumes it.
app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/session", async (request, response, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    response.json(session);
  } catch (error) {
    next(error);
  }
});

app.use(express.json({ limit: "1mb" }));
app.use("/api", healthRouter);
app.use("/api", accountRouter);
app.use("/api", bookingsRouter);
app.use("/api", studiosRouter);
app.use("/api", hostStudiosRouter);
app.use("/api", imageUploadsRouter);
app.use("/api", newsletterRouter);
app.use("/api", savedStudiosRouter);
app.use("/api", studioDetailsRouter);
app.use((_request, response) => {
  response.status(404).json({ status: "error", message: "Route not found." });
});
app.use(errorHandler);
