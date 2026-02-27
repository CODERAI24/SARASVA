import { Router } from "express";
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  addSubjectToExam,
  removeSubjectFromExam,
  addChapter,
  updateChapter,
  deleteChapter,
} from "../controllers/exam.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/",    getExams);
router.post("/",   createExam);
router.patch("/:id",  updateExam);
router.delete("/:id", deleteExam);

router.post("/:id/subjects",              addSubjectToExam);
router.delete("/:id/subjects/:subjectId", removeSubjectFromExam);

router.post("/:id/subjects/:subjectId/chapters",
  addChapter);
router.patch("/:id/subjects/:subjectId/chapters/:chapterId",
  updateChapter);
router.delete("/:id/subjects/:subjectId/chapters/:chapterId",
  deleteChapter);

export default router;
