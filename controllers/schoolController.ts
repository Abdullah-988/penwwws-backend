import { Request, Response } from "express";
import db from "../lib/db";
import { Role } from "@prisma/client";

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
    let subjects = [];

    if (req.user.isAdmin) {
      subjects = await db.subject.findMany({
        where: {
          schoolId: req.params.id,
        },
        include: {
          users: {
            where: {
              role: Role.TEACHER,
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
          },
        },
      });

      subjects = subjects.map((subject) => {
        const { users, ...rest } = subject;

        return {
          ...rest,
          teachers: subject.users.map((teacher) => {
            return {
              ...teacher.user,
            };
          }),
        };
      });
    } else {
      const subjectsNotFiltered = await db.memberOnSubject.findMany({
        where: {
          schoolId: req.params.id,
          userId: req.user.id,
        },
        select: {
          subject: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              schoolId: true,
              createdAt: true,
              updatedAt: true,
              users: {
                where: {
                  role: Role.TEACHER,
                },
                select: {
                  user: {
                    select: {
                      id: true,
                      avatarUrl: true,
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      subjects = subjectsNotFiltered.map((subject) => {
        const { users, ...rest } = subject.subject;

        return {
          ...rest,
          teachers: subject.subject.users.map((teacher) => {
            return {
              ...teacher.user,
            };
          }),
        };
      });
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
      include: {
        users: {
          where: {
            role: Role.TEACHER,
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
        },
      },
    });

    if (!subject) {
      return res.status(404).send("Not Found");
    }

    const { users, ...rest } = subject;

    const filteredSubject = {
      ...rest,
      teachers: subject.users.map((teacher) => {
        return {
          ...teacher.user,
        };
      }),
    };

    return res.status(200).json(filteredSubject);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Edit a subject
// @route   PUT /api/school/:id/subject/:subjectId
// @access  Private
export const editSubject = async (req: Request, res: Response) => {
  try {
    const isSubjectOwnedBySchool = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });

    if (isSubjectOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { name, imageUrl } = req.body;

    let subjectName = isSubjectOwnedBySchool.name;
    let subjectImageUrl = isSubjectOwnedBySchool.imageUrl;

    if (!name && !imageUrl && imageUrl != null) {
      return res.status(400).send("Missing required fields");
    }

    if (!!name) {
      subjectName = name;
    }

    if (!!imageUrl || imageUrl == null) {
      subjectImageUrl = imageUrl;
    }

    const subject = await db.subject.update({
      where: {
        id: Number(req.params.subjectId),
      },
      data: {
        name: subjectName,
        imageUrl: subjectImageUrl,
      },
    });

    return res.status(200).json(subject);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/school/:id/subject/:subjectId
// @access  Private
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const isSubjectOwnedBySchool = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });

    if (isSubjectOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const subject = await db.subject.delete({
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

// @desc    Get members
// @route   GET /api/school/:id/member
// @access  Private
export const getMembers = async (req: Request, res: Response) => {
  try {
    const members = await db.memberOnSchools.findMany({
      where: {
        schoolId: req.params.id,
        NOT: {
          userId: req.user.id,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            avatarUrl: true,
            fullName: true,
            email: true,
          },
        },
        role: true,
      },
    });

    const filteredMembers = members.map((member) => {
      return {
        ...member.user,
        role: member.role,
      };
    });

    return res.status(200).json(filteredMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
