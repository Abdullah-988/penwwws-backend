import express from "express";
import {
  createSchool,
  createSubject,
  editSubject,
  deleteSubject,
  getMembers,
  getSchool,
  getSchools,
  getSubject,
  getSubjects,
  createGroup,
  getGroups,
  editGroup,
  deleteGroup,
  assignToGroup,
  getGroup,
  unAssignFromGroup,
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
router.put("/school/:id/subject/:subjectId", protect, admin, editSubject);
router.delete("/school/:id/subject/:subjectId", protect, admin, deleteSubject);

router.get("/school/:id/member", protect, admin, getMembers);

router.post("/school/:id/group", protect, admin, createGroup);
router.get("/school/:id/group", protect, admin, getGroups);
router.get("/school/:id/group/:groupId", protect, admin, getGroup);
router.put("/school/:id/group/:groupId", protect, admin, editGroup);
router.delete("/school/:id/group/:groupId", protect, admin, deleteGroup);
router.post("/school/:id/group/:groupId/member", protect, admin, assignToGroup);
router.delete("/school/:id/group/:groupId/member", protect, admin, unAssignFromGroup);

export default router;
