import { Request, Response } from "express";
import db from "../lib/db";
import { Role, Subject } from "@prisma/client";

// @desc    Create a school
// @route   POST /api/school
// @access  Private
export const createSchool = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const school = await db.school.create({
      data: {
        name,
        members: {
          create: {
            userId: req.user.id,
            role: "SUPER_ADMIN",
          },
        },
      },
    });

    return res.status(201).json(school);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school data
// @route   GET /api/school/:id
// @access  Private
export const getSchool = async (req: Request, res: Response) => {
  try {
    let count;
    if (req.user.isAdmin) {
      count = {
        _count: {
          select: {
            subjects: true,
          },
        },
      };
    }

    let school;
    school = await db.school.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        members: {
          where: {
            userId: req.user.id,
          },
          select: {
            role: true,
          },
        },
        ...count,
      },
    });

    if (req.user.isAdmin && !!school) {
      const { _count, ...rest } = school;

      const allMembers = await db.memberOnSchools.findMany({
        where: {
          schoolId: req.params.id,
        },
        select: {
          role: true,
        },
      });

      school = {
        ...rest,
        _count: {
          ..._count,
          students: allMembers.filter((member) => member.role == Role.STUDENT).length,
          teachers: allMembers.filter((member) => member.role == Role.TEACHER).length,
        },
      };
    }

    return res.status(200).json(school);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get joined and created schools
// @route   GET /api/school
// @access  Private
export const getSchools = async (req: Request, res: Response) => {
  try {
    const schools = await db.memberOnSchools.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        school: {
          include: {
            members: {
              where: {
                userId: req.user.id,
              },
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(schools);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/school/:id/subject
// @access  Private
export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const subject = await db.subject.create({
      data: {
        name,
        schoolId: req.params.id,
      },
    });

    return res.status(201).json(subject);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get subjects
// @route   GET /api/school/:id/subject
// @access  Private
export const getSubjects = async (req: Request, res: Response) => {
  try {
    let subjects: Subject[] = [];

    if (req.user.isAdmin) {
      subjects = await db.subject.findMany({
        where: {
          schoolId: req.params.id,
        },
      });
    } else {
      const subjectsNotFiltered = await db.memberOnSubject.findMany({
        where: {
          schoolId: req.params.id,
          userId: req.user.id,
        },
        include: {
          subject: true,
        },
      });

      subjects = subjectsNotFiltered.map((subject) => subject.subject);
    }

    return res.status(200).json(subjects);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get a subject
// @route   GET /api/school/:id/subject/:subjectId
// @access  Private
export const getSubject = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && !isSubjectMember) {
      return res.status(404).send("Not Found");
    }

    const subject = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });

    return res.status(200).json(subject);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
