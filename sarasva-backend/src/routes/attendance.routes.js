import { Router } from "express";
import {
  getToday,
  markAttendance,
  getSummary,
  getAttendanceLog,
} from "../controllers/attendance.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/today",  getToday);
router.post("/mark",  markAttendance);
router.get("/summary", getSummary);
router.get("/",        getAttendanceLog);

export default router;
