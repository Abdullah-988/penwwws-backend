import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../lib/db";
import { generateToken } from "./userController";

// @desc    Authenticate a device login credential
// @route   POST /api/device/login
// @access  Public
export const loginDeviceToCredential = async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).send("Missing required fields");
    }

    const credential = await db.deviceCredentials.findFirst({
      where: {
        credentialId: id,
      },
      select: {
        id: true,
        credentialId: true,
        hashedPassword: true,
        schoolId: true,
      },
    });

    if (!credential) {
      return res.status(400).send("Incorrect id or password");
    }

    const passwordMatch = await bcrypt.compare(password, credential.hashedPassword);

    if (!passwordMatch) {
      return res.status(400).send("Incorrect id or password");
    }

    const token = await generateToken({ schoolId: credential.schoolId });

    res.setHeader("Authorization", `Bearer ${token}`);

    const { hashedPassword, ...credentialWithoutPassword } = credential;

    return res.status(200).json(credentialWithoutPassword);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school information
// @route   POST /api/device/school
// @access  Private
export const getSchool = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(req.school);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school students
// @route   GET /api/device/school/student
// @access  Private
export const getStudents = async (req: Request, res: Response) => {
  try {
    const members = await db.memberOnSchools.findMany({
      where: {
        schoolId: req.school.id,
        role: "STUDENT",
      },
      include: {
        user: {
          omit: {
            hashedPassword: true,
            isEmailVerified: true,
            provider: true,
          },
        },
      },
    });

    const reponse = members.map((member) => {
      return {
        ...member.user,
      };
    });

    return res.status(200).json(reponse);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school students by group
// @route   GET /api/device/school/student/group/:groupId
// @access  Private
export const getStudentsByGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);

    const group = await db.group.findFirst({
      where: {
        id: groupId,
        schoolId: req.school.id,
      },
    });

    if (!group) {
      return res.status(404).send("Group not found");
    }

    const members = await db.memberOnGroup.findMany({
      where: {
        groupId,
      },
      include: {
        user: {
          omit: {
            hashedPassword: true,
            isEmailVerified: true,
            provider: true,
          },
        },
      },
    });

    const reponse = members.map((member) => {
      return {
        ...member.user,
      };
    });

    return res.status(200).json(reponse);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school students by group
// @route   GET /api/device/school/student/subject/:subjectId
// @access  Private
export const getStudentsBySubject = async (req: Request, res: Response) => {
  try {
    const subjectId = Number(req.params.subjectId);

    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: req.school.id,
      },
    });

    if (!subject) {
      return res.status(404).send("Subject not found");
    }

    const members = await db.memberOnSubject.findMany({
      where: {
        subjectId,
      },
      include: {
        user: {
          omit: {
            hashedPassword: true,
            isEmailVerified: true,
            provider: true,
          },
        },
      },
    });

    const reponse = members.map((member) => {
      return {
        ...member.user,
      };
    });

    return res.status(200).json(reponse);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school groups
// @route   GET /api/device/school/group
// @access  Private
export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await db.group.findMany({
      where: {
        schoolId: req.school.id,
      },
      omit: {
        schoolId: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    return res.status(200).json(groups);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school subjects
// @route   GET /api/device/school/subject
// @access  Private
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await db.subject.findMany({
      where: {
        schoolId: req.school.id,
      },
      omit: {
        schoolId: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    return res.status(200).json(subjects);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Add an attendance
// @route   POST /api/device/school/session/:sessionId
// @access  Private
export const addAttendance = async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.sessionId);

    const session = await db.attendanceSession.findFirst({
      where: {
        id: sessionId,
        subject: {
          schoolId: req.school.id,
        },
      },
    });

    if (!session) {
      return res.status(404).send("Session not found");
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).send("Missing required fields");
    }

    const student = await db.memberOnSchools.findFirst({
      where: {
        userId: studentId,
        schoolId: req.school.id,
      },
    });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    const attendance = await db.attendance.findFirst({
      where: {
        sessionId,
        userId: studentId,
      },
    });

    if (!!attendance) {
      return res.status(400).send("Attendance already added");
    }

    if (session.expirationDate < new Date()) {
      return res.status(400).send("Session expired");
    }

    const newAttendance = await db.attendance.create({
      data: {
        sessionId,
        userId: studentId,
      },
    });

    return res.status(200).json(newAttendance);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
