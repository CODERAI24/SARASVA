import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/",    getTasks);
router.post("/",   createTask);
router.patch("/:id",  updateTask);
router.delete("/:id", deleteTask);

export default router;
