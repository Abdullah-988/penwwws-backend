import express from "express";
import {
  createSchool,
  createSubject,
  getMembers,
  getSchool,
  getSchools,
  getSubject,
  getSubjects,
} from "../controllers/schoolController";
import { protect } from "../middleware/authMiddleware";
import { admin } from "../middleware/adminMiddleware";
import { access } from "../middleware/accessMiddleware";

const router = express.Router();

router.post("/school", protect, createSchool);
router.get("/school", protect, getSchools);
router.get("/school/:id", protect, access, getSchool);

router.post("/school/:id/subject", protect, admin, createSubject);
router.get("/school/:id/subject", protect, access, getSubjects);
router.get("/school/:id/subject/:subjectId", protect, access, getSubject);

router.get("/school/:id/member", protect, admin, getMembers);

export default router;
