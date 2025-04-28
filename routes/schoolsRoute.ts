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
  addAssignment,
  getAssignments,
  getTopics,
  addAssignmentSubmission,
  getAssignmentSubmissions,
  deleteAssignmentSubmission,
  deleteAssignment,
  editAssignment,
  addMarksTableRow,
  getMarksTableRows,
  editMarksTableRow,
  deleteMarksTableRow,
  getStudentMarksTable,
  addMarksToStudentTable,
  getGrade,
  createCredentials,
  deleteCredentials,
  getCredentials,
  getAttendanceSessions,
  addAttendanceSession,
  editAttendanceSession,
  deleteAttendanceSession,
  getAttendanceSessionAttendersAndNonAttenders,
  DeleteAnAttendance,
  getLogs,
  getLogsTeachers,
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

router.get("/school/:id/subject/:subjectId/topic", protect, access, getTopics);
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
router.get("/school/:id/subject/:subjectId/assignment", protect, access, getAssignments);
router.post("/school/:id/subject/:subjectId/assignment", protect, access, addAssignment);
router.put(
  "/school/:id/subject/:subjectId/assignment/:assignmentId",
  protect,
  access,
  editAssignment
);
router.get(
  "/school/:id/subject/:subjectId/assignment/:assignmentId/submission",
  protect,
  access,
  getAssignmentSubmissions
);
router.post(
  "/school/:id/subject/:subjectId/assignment/:assignmentId/submission",
  protect,
  access,
  addAssignmentSubmission
);
router.delete(
  "/school/:id/subject/:subjectId/assignment/:assignmentId",
  protect,
  access,
  deleteAssignment
);
router.delete(
  "/school/:id/subject/:subjectId/assignment/:assignmentId/submission/:submissionId",
  protect,
  access,
  deleteAssignmentSubmission
);

router.get("/school/:id/subject/:subjectId/table", protect, access, getMarksTableRows);
router.post("/school/:id/subject/:subjectId/table", protect, access, addMarksTableRow);
router.put(
  "/school/:id/subject/:subjectId/table/:rowId",
  protect,
  access,
  editMarksTableRow
);
router.delete(
  "/school/:id/subject/:subjectId/table/:rowId",
  protect,
  access,
  deleteMarksTableRow
);
router.get(
  "/school/:id/subject/:subjectId/table/student/:studentId",
  protect,
  access,
  getStudentMarksTable
);
router.post(
  "/school/:id/subject/:subjectId/table/student/:studentId",
  protect,
  access,
  addMarksToStudentTable
);
router.get("/school/:id/subject/:subjectId/grade", protect, access, getGrade);

router.get("/school/:schoolId/device", protect, admin, getCredentials);
router.post("/school/:schoolId/device", protect, admin, createCredentials);
router.delete(
  "/school/:schoolId/device/:credentialId",
  protect,
  admin,
  deleteCredentials
);

router.get(
  "/school/:id/subject/:subjectId/session",
  protect,
  access,
  getAttendanceSessions
);
router.post(
  "/school/:id/subject/:subjectId/session",
  protect,
  access,
  addAttendanceSession
);
router.put(
  "/school/:id/subject/:subjectId/session/:sessionId",
  protect,
  access,
  editAttendanceSession
);
router.delete(
  "/school/:id/subject/:subjectId/session/:sessionId",
  protect,
  access,
  deleteAttendanceSession
);
router.get(
  "/school/:id/subject/:subjectId/session/:sessionId/attenders",
  protect,
  access,
  getAttendanceSessionAttendersAndNonAttenders
);
router.delete(
  "/school/:id/subject/:subjectId/session/:sessionId/attenders/:attendanceId",
  protect,
  access,
  DeleteAnAttendance
);
router.get("/school/:id/subject/:subjectId/log", protect, admin, getLogs);
router.get("/school/:id/subject/:subjectId/log/teacher", protect, admin, getLogsTeachers);

export default router;
