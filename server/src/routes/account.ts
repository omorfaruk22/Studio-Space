import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const accountRouter = Router();

accountRouter.get("/account", requireAuth, (_request, response) => {
  const session = response.locals.authSession as {
    user: { id: string; name: string; email: string; image?: string | null };
  };

  response.json({ user: session.user });
});
