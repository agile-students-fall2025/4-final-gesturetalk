import { Router } from "express";
import { getHomeData } from "../controllers/homeController.js";

const router = Router();

router.get("/", getHomeData);
// do we need post for Home?
router.post("/", updateHomeData)

export default router;
