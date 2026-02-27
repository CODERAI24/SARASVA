import { Router } from "express";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/",    getSubjects);
router.post("/",   createSubject);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
