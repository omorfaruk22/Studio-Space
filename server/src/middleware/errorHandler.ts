import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = typeof error?.status === "number" ? error.status : 500;
  const message = statusCode >= 500 ? "An unexpected server error occurred." : error.message;

  if (statusCode >= 500) console.error(error);
  response.status(statusCode).json({ status: "error", message });
};
