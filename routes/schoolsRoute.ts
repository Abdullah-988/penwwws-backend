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
  assignToSubject,
  getGroupMembers,
  inviteUser,
  acceptInvitation,
  unAssignFromSubject,
  deleteSchool,
  removeFromSchool,
  editSchool,
  getAdmissions,
  admissionReview,
  getInvitationTokens,
  deleteInvitationToken,
  createTopic,
  editTopic,
  deleteTopic,
  addDocument,
  editDocument,
  deleteDocument,
} from "../controllers/schoolController";
import { protect } from "../middleware/authMiddleware";
import { admin } from "../middleware/adminMiddleware";
import { access } from "../middleware/accessMiddleware";

const router = express.Router();

router.post("/school", protect, createSchool);
router.get("/school", protect, getSchools);
router.get("/school/:id", protect, access, getSchool);
router.put("/school/:id", protect, admin, editSchool);
router.delete("/school/:id", protect, access, deleteSchool);
router.delete("/school/:id/member", protect, admin, removeFromSchool);
router.post("/school/:id/invite", protect, admin, inviteUser);
router.post("/invite/:inviteToken", protect, acceptInvitation);
router.get("/school/:id/invitation", protect, admin, getInvitationTokens);
router.get("/school/:id/admission", protect, admin, getAdmissions);
router.post("/school/:id/admission/:admissionId/review", protect, admin, admissionReview);
router.delete("/school/:id/invitation/:tokenId", protect, admin, deleteInvitationToken);

router.post("/school/:id/subject", protect, admin, createSubject);
router.get("/school/:id/subject", protect, access, getSubjects);
router.get("/school/:id/subject/:subjectId", protect, access, getSubject);
router.put("/school/:id/subject/:subjectId", protect, admin, editSubject);
router.delete("/school/:id/subject/:subjectId", protect, admin, deleteSubject);
router.post("/school/:id/subject/:subjectId/member", protect, admin, assignToSubject);
router.delete(
  "/school/:id/subject/:subjectId/member",
  protect,
  admin,
  unAssignFromSubject
);

router.get("/school/:id/member", protect, admin, getMembers);

router.post("/school/:id/group", protect, admin, createGroup);
router.get("/school/:id/group", protect, admin, getGroups);
router.get("/school/:id/group/:groupId", protect, admin, getGroup);
router.put("/school/:id/group/:groupId", protect, admin, editGroup);
router.delete("/school/:id/group/:groupId", protect, admin, deleteGroup);
router.get("/school/:id/group/:groupId/member", protect, admin, getGroupMembers);
router.post("/school/:id/group/:groupId/member", protect, admin, assignToGroup);
router.delete("/school/:id/group/:groupId/member", protect, admin, unAssignFromGroup);

router.post("/school/:id/subject/:subjectId/topic", protect, access, createTopic);
router.put("/school/:id/subject/:subjectId/topic/:topicId", protect, access, editTopic);
router.delete(
  "/school/:id/subject/:subjectId/topic/:topicId",
  protect,
  access,
  deleteTopic
);

router.post(
  "/school/:id/subject/:subjectId/topic/:topicId/document",
  protect,
  access,
  addDocument
);
router.put(
  "/school/:id/subject/:subjectId/topic/:topicId/document/:documentId",
  protect,
  access,
  editDocument
);
router.delete(
  "/school/:id/subject/:subjectId/topic/:topicId/document/:documentId",
  protect,
  access,
  deleteDocument
);

export default router;
