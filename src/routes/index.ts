// src/router/index.ts
import { Router } from "express";

import authRouter from "../modules/auth/routes";

// Catálogo / público
import offersRouter from "../modules/offers/routes";
import categoriesRouter from "../modules/categories/routes";
import publicProvidersRoutes from "../modules/public/providers.routes";

// Privado (login necessário)
import myOffersRouter from "../modules/offers/my.routes";
import jobsRouter from "../modules/jobs/routes";
import conversationsRouter from "../modules/conversations/routes";
import addressesRouter from "../modules/addresses/routes";
import usersRouter from "../modules/users/routes";
import providersRouter from "../modules/providers/routes";

import { authRequired } from "../middlewares/auth";

const router = Router();

/* ---------- Healthcheck ---------- */
router.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------- Auth ---------- */
router.use("/auth", authRouter);

/* ---------- Rotas públicas ---------- */
// catálogo de ofertas
router.use("/offers", offersRouter);
// categorias (se desejar, pode deixar pública)
router.use("/categories", categoriesRouter);
// perfis públicos de prestadores (listagem e detalhe)
router.use("/public/providers", publicProvidersRoutes);

/* ---------- Rotas protegidas (precisam de login) ---------- */
// ofertas do próprio prestador
router.use("/my/offers", authRequired, myOffersRouter);

// jobs, conversas, endereços, usuários
router.use("/jobs", authRequired, jobsRouter);
router.use("/conversations", authRequired, conversationsRouter);
router.use("/addresses", authRequired, addressesRouter);
router.use("/users", authRequired, usersRouter);

// rotas privadas de prestadores (p.ex. gerenciamento do perfil)
router.use("/providers", authRequired, providersRouter);

export default router;
