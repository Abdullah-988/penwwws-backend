import express from "express";
import { device } from "../middleware/deviceMiddleware";
import {
  addAttendance,
  addFingerprint,
  getFingerprint,
  getFingerprints,
  getGroups,
  getSchool,
  getStudents,
  getStudentsByGroup,
  getStudentsBySession,
  getStudentsBySubject,
  getSubjects,
  getSubjectSessions,
  loginDeviceToCredential,
} from "../controllers/deviceController";

const router = express.Router();

router.post("/device/login", loginDeviceToCredential);

router.get("/device/school", device, getSchool);
router.get("/device/school/student", device, getStudents);
router.get("/device/school/student/group/:groupId", device, getStudentsByGroup);
router.get("/device/school/student/subject/:subjectId", device, getStudentsBySubject);
router.get("/device/school/group", device, getGroups);
router.get("/device/school/subject", device, getSubjects);
router.get("/device/school/subject/:subjectId/session", device, getSubjectSessions);
router.get("/device/school/student/session/:sessionId", device, getStudentsBySession);
router.post("/device/school/fingerprint", device, addFingerprint);
router.get("/device/school/fingerprint/:studentId", device, getFingerprint);
router.get("/device/school/subject/:subjectId/fingerprint", device, getFingerprints);
router.post("/device/school/session/:sessionId", device, addAttendance);

export default router;
