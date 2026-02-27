import { Router } from "express";
import {
  getTimetables,
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
  activateTimetable,
  addSlot,
  deleteSlot,
} from "../controllers/timetable.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/",    getTimetables);
router.post("/",   createTimetable);

router.get("/:id",    getTimetable);
router.patch("/:id",  updateTimetable);
router.delete("/:id", deleteTimetable);

router.patch("/:id/activate", activateTimetable);

router.post("/:id/slots",             addSlot);
router.delete("/:id/slots/:slotId",   deleteSlot);

export default router;
