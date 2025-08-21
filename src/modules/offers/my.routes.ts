import { Router, Request, Response } from "express";
import { prisma } from "../../db/client";
import { Unit, Role } from "@prisma/client";

const r = Router();

// exige login + papel provider/admin
function ensureProvider(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED" });
  if (![Role.provider, Role.admin].includes(user.role)) {
    return res.status(403).json({ code: "FORBIDDEN" });
  }
  next();
}

// GET /api/my/offers -> SOMENTE as ofertas do prestador logado
r.get("/", ensureProvider, async (req, res) => {
  const user = (req as any).user;

  const items = await prisma.serviceOffer.findMany({
    where: { provider: { userId: user.id } }, // <- filtra pelo dono
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceBase: true,
      unit: true,
      active: true,
      categoryId: true,
      createdAt: true,
    },
  });

  res.json({ items });
});

// POST /api/my/offers -> cria oferta
r.post("/", ensureProvider, async (req, res) => {
  const user = (req as any).user;

  const prof = await prisma.providerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!prof) return res.status(404).json({ code: "PROVIDER_PROFILE_NOT_FOUND" });

  const { title, description, priceBase, unit, categoryId, active } = req.body || {};
  if (!title || !priceBase || !unit || !categoryId) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Campos obrigatórios: title, priceBase, unit, categoryId",
    });
  }

  const created = await prisma.serviceOffer.create({
    data: {
      providerId: prof.id,
      categoryId,
      title,
      description: description ?? "",
      priceBase,
      unit: unit as Unit,
      active: active ?? true,
    },
  });
  res.status(201).json({ offer: created });
});

// PUT /api/my/offers/:id -> edita somente se for dono
r.put("/:id", ensureProvider, async (req, res) => {
  const user = (req as any).user;

  const existing = await prisma.serviceOffer.findFirst({
    where: { id: req.params.id, provider: { userId: user.id } },
  });
  if (!existing) return res.status(404).json({ code: "OFFER_NOT_FOUND" });

  const { title, description, priceBase, unit, categoryId, active } = req.body || {};
  const updated = await prisma.serviceOffer.update({
    where: { id: existing.id },
    data: { title, description, priceBase, unit: unit as Unit, categoryId, active },
  });
  res.json({ offer: updated });
});

// DELETE /api/my/offers/:id -> remove somente se for dono
r.delete("/:id", ensureProvider, async (req, res) => {
  const user = (req as any).user;

  const existing = await prisma.serviceOffer.findFirst({
    where: { id: req.params.id, provider: { userId: user.id } },
  });
  if (!existing) return res.status(404).json({ code: "OFFER_NOT_FOUND" });

  await prisma.serviceOffer.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

export default r;
