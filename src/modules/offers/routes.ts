// src/modules/offers/routes.ts
import { Router } from "express";
import { prisma } from "../../db/client";
import { z } from "zod";

const router = Router();

/**
 * GET /api/offers
 * Query:
 *  - page, pageSize
 *  - categoryId (UUID da categoria)
 *  - qCategory (texto a buscar no nome/slug da categoria)
 */
router.get("/", async (req, res) => {
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(50).default(12),
    categoryId: z.string().uuid().optional(),
    qCategory: z.string().optional(),
  });

  const { page, pageSize, categoryId, qCategory } = schema.parse(req.query);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = { active: true };

  if (categoryId) where.categoryId = categoryId;

  if (qCategory && qCategory.trim()) {
    const q = qCategory.trim();
    // filtra pela categoria (nome ou slug)
    where.category = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q.toLowerCase() } },
      ],
    };
  }

  const [total, items] = await Promise.all([
    prisma.serviceOffer.count({ where }),
    prisma.serviceOffer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        priceBase: true,
        unit: true,
        active: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        providerId: true, // ProviderProfile.id
        provider: {
          select: {
            id: true,
            user: { select: { id: true, name: true, photoUrl: true } },
          },
        },
      },
    }),
  ]);

  res.json({ total, page, pageSize, items });
});

export default router;
