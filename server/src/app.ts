import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", healthRouter);
app.use((_request, response) => {
  response.status(404).json({ status: "error", message: "Route not found." });
});
app.use(errorHandler);
