import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mealsRouter from "./meals";
import analyticsRouter from "./analytics";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mealsRouter);
router.use(analyticsRouter);
router.use(settingsRouter);

export default router;
