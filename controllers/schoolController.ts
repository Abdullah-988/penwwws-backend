import { Request, Response } from "express";
import db from "../lib/db";

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
    const schools = await db.memberOnSchools.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        school: true,
      },
    });

    return res.status(200).json(schools);
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
    const isSchoolMember = await db.memberOnSchools.findFirst({
      where: {
        userId: req.user.id,
        schoolId: Number(req.params.id),
      },
    });

    if (!isSchoolMember) {
      return res.status(404).send("Not Found");
    }

    const school = await db.school.findFirst({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json(school);
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

    const isSchoolAdmin = await db.memberOnSchools.findFirst({
      where: {
        userId: req.user.id,
        schoolId: Number(req.params.id),
        OR: [
          {
            role: {
              equals: "SUPER_ADMIN",
            },
          },
          { role: { equals: "ADMIN" } },
        ],
      },
    });

    if (!isSchoolAdmin) {
      return res.status(403).send("Forbidden");
    }

    const subject = await db.subject.create({
      data: {
        name,
        schoolId: Number(req.params.id),
      },
    });

    return res.status(201).json(subject);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
