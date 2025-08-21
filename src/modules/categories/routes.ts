import { Router } from "express";
import { prisma } from "../../db/client";

const r = Router();

r.get("/", async (_req, res) => {
  const items = await prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json({ items });
});

export default r;
