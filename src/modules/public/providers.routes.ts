import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client";

const r = Router();

/** GET /api/public/providers?q=&page=&pageSize=  */
r.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 12)));
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Prisma.ProviderProfileWhereInput = {
    offers: { some: { active: true } },
    ...(q ? { user: { name: { contains: q, mode: "insensitive" } } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.providerProfile.count({ where }),
    prisma.providerProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bio: true,
        verified: true,
        radiusKm: true,
        scoreAvg: true,
        totalReviews: true,
        user: { select: { id: true, name: true, photoUrl: true } },
        offers: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, title: true, priceBase: true, unit: true },
        },
      },
    }),
  ]);

  res.json({ total, page, pageSize: take, items });
});

/** GET /api/public/providers/:id  */
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
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, priceBase: true, unit: true },
      },
    },
  });

  if (!provider) return res.status(404).json({ code: "NOT_FOUND" });
  res.json(provider);
});

export default r;
