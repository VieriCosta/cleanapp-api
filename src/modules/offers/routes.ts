// src/modules/offers/routes.ts
import { Router } from "express";
import { prisma } from "../../db/client";

const r = Router();

/**
 * Lista pública de ofertas (sem exigir login).
 * Paginação: ?page=&pageSize=
 */
r.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 12)));
  const skip = (page - 1) * pageSize;

  const where = { active: true };

  const [total, items] = await Promise.all([
    prisma.serviceOffer.count({ where }),
    prisma.serviceOffer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        priceBase: true,
        unit: true,
        active: true,
        // <- ESSENCIAIS PARA A HOME/NAVEGAÇÃO
        providerId: true, // id do ProviderProfile dono da oferta
        provider: {
          select: {
            id: true,
            verified: true,
            scoreAvg: true,
            totalReviews: true,
            user: { select: { id: true, name: true, photoUrl: true } },
          },
        },
      },
    }),
  ]);

  res.json({ total, page, pageSize, items });
});

export default r;
