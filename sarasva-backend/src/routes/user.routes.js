import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

// All user routes require authentication
router.use(protect);

router.get("/profile",  getProfile);
router.patch("/profile", updateProfile);

router.get("/settings",  getSettings);
router.patch("/settings", updateSettings);

export default router;
