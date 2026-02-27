import { Router } from "express";
import {
  register,
  login,
  getMe,
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe);

export default router;
