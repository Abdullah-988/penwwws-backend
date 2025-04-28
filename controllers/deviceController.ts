import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../lib/db";
import { generateToken } from "./userController";
import { User } from "@prisma/client";

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

// @desc    Get subject sessions
// @route   GET /api/device/school/subject/:subjectId/session
// @access  Private
export const getSubjectSessions = async (req: Request, res: Response) => {
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

    const sessions = await db.attendanceSession.findMany({
      where: {
        subjectId,
        expirationDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(sessions);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get session student
// @route   GET /api/device/school/student/session/:sessionId
// @access  Private
export const getStudentsBySession = async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.sessionId);

    const session = await db.attendanceSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      return res.status(404).send("Session not found");
    }

    const subject = await db.subject.findUnique({
      where: {
        id: session.subjectId,
      },
    });

    if (subject?.schoolId !== req.school.id) {
      return res.status(404).send("Session not found");
    }

    const members = await db.memberOnSubject.findMany({
      where: {
        subjectId: session.subjectId,
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

    const attenders = await db.attendance.findMany({
      where: {
        sessionId: sessionId,
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

    const response: Omit<
      Omit<Omit<User[], "hashedPassword">, "isEmailVerified">,
      "provider"
    > = [];
    members.map((member) => {
      const isAttended = attenders.find((attender) => attender.userId === member.userId);

      if (!isAttended) {
        // @ts-expect-error Prisma user type
        response.push(member.user);
      }
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Add a fingerprint
// @route   POST /api/device/school/fingerprint
// @access  Private
export const addFingerprint = async (req: Request, res: Response) => {
  try {
    const { studentId, fingerprint } = req.body;

    if (!studentId || !fingerprint) {
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

    const createdFingerprint = await db.fingerprint.create({
      data: {
        content: fingerprint,
        schoolId: req.school.id,
        userId: studentId,
      },
    });

    return res.status(200).json(createdFingerprint);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
// @desc    Get a fingerprint
// @route   GET /api/device/school/fingerprint/:studentId
// @access  Private
export const getFingerprint = async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);

    const student = await db.memberOnSchools.findFirst({
      where: {
        userId: studentId,
        schoolId: req.school.id,
      },
    });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    const fingerprint = await db.fingerprint.findFirst({
      where: {
        userId: studentId,
        schoolId: req.school.id,
      },
    });

    if (!fingerprint) {
      return res.status(404).send("Fingerprint not found");
    }

    return res.status(200).json({ fingerprint: fingerprint.content });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get all fingerprints of subject members
// @route   GET /api/device/school/subject/:subjectId/fingerprint
// @access  Private
export const getFingerprints = async (req: Request, res: Response) => {
  try {
    const subject = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });
    if (!subject) {
      return res.status(404).send("Subject not found");
    }

    if (subject.schoolId !== req.school.id) {
      return res.status(404).send("Subject not found");
    }

    const subjectMembers = await db.memberOnSubject.findMany({
      where: {
        subjectId: subject.id,
      },
      include: {
        user: {
          omit: {
            hashedPassword: true,
          },
        },
      },
    });

    const memberIds: number[] = [];

    subjectMembers.map((member) => {
      memberIds.push(member.userId);
    });

    const fingerprints = await db.fingerprint.findMany({
      where: {
        userId: {
          in: memberIds,
        },
        schoolId: req.school.id,
      },
      include: {
        user: {
          select: {
            id: true,
            avatarUrl: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(fingerprints);
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
