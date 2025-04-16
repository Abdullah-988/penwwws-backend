import express from "express";
import { device } from "../middleware/deviceMiddleware";
import {
  getGroups,
  getSchool,
  getStudents,
  getStudentsByGroup,
  getStudentsBySubject,
  getSubjects,
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

export default router;
