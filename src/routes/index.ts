import { Router } from "express";
import authRouter from "../modules/auth/routes";
import offersRouter from "../modules/offers/routes";
import myOffersRouter from "../modules/offers/my.routes";
import jobsRouter from "../modules/jobs/routes";
import conversationsRouter from "../modules/conversations/routes";
import addressesRouter from "../modules/addresses/routes";
import usersRouter from "../modules/users/routes";
import categoriesRouter from "../modules/categories/routes";
import { authRequired } from "../middlewares/auth";
import providersRouter from "../modules/providers/routes";

const router = Router();

router.use("/auth", authRouter);

// Pública/geral (catálogo)
router.use("/offers", offersRouter);
router.use("/providers", providersRouter);

// 🔒 Somente do prestador logado
router.use("/my/offers", authRequired, myOffersRouter);

// Demais recursos protegidos
router.use("/jobs", authRequired, jobsRouter);
router.use("/conversations", authRequired, conversationsRouter);
router.use("/addresses", authRequired, addressesRouter);
router.use("/users", authRequired, usersRouter);

// Categorias (pode ser pública)
router.use("/categories", categoriesRouter);

export default router;
