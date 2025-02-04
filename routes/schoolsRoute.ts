import express from "express";
import {
  createSchool,
  createSubject,
  getSchool,
  getSchools,
} from "../controllers/schoolController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/school", protect, createSchool);
router.get("/school", protect, getSchools);
router.get("/school/:id", protect, getSchool);

router.post("/school/:id/subject", protect, createSubject);

export default router;
