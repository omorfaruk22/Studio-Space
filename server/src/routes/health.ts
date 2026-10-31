import { Router } from "express";
import { getDatabaseStatus } from "../config/database";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  const database = getDatabaseStatus();
  response.status(200).json({
    status: "ok",
    service: "studiospace-api",
    database,
    ready: database === "connected",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
