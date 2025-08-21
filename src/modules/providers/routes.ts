// src/modules/providers/public.routes.ts
import { Router } from "express";
import { prisma } from "../../db/client";

const r = Router();

/**
 * Perfil público do prestador
 * GET /api/public/providers/:id
 */
r.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  const provider = await prisma.providerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      bio: true,
      verified: true,
      scoreAvg: true,
      totalReviews: true,
      radiusKm: true,
      user: { select: { id: true, name: true, photoUrl: true } },
      offers: {
        where: { active: true },
        select: { id: true, title: true, priceBase: true, unit: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!provider) return res.status(404).json({ code: "NOT_FOUND" });
  res.json(provider);
});

export default r;
