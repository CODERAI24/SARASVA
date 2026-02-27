import { Router } from "express";
import authRoutes       from "./auth.routes.js";
import userRoutes       from "./user.routes.js";
import subjectRoutes    from "./subject.routes.js";
import timetableRoutes  from "./timetable.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import examRoutes       from "./exam.routes.js";
import taskRoutes       from "./task.routes.js";

const router = Router();

router.use("/auth",       authRoutes);
router.use("/user",       userRoutes);
router.use("/subjects",   subjectRoutes);
router.use("/timetables", timetableRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/exams",      examRoutes);
router.use("/tasks",      taskRoutes);

export default router;
