import { Request, Response } from "express";
import db from "../lib/db";
import { Role, SubjectRole } from "@prisma/client";
import axios from "axios";
import { generateSignature } from "../util/cloudinary";

// @desc    Create an invitation link
// @route   POST /api/school/:id/invite
// @access  Private
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).send("Missing required fields");
    }

    if (
      role.toLowerCase() != "student" &&
      role.toLowerCase() != "teacher" &&
      role.toLowerCase() != "admin"
    ) {
      return res.status(400).send("Invalid role name");
    }

    const inviteTokenString =
      crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const invite = await db.inviteToken.create({
      data: {
        token: inviteTokenString,
        schoolId: req.params.id,
        role: role.toUpperCase(),
      },
    });

    if (!invite) {
      return res.status(500).send("There is an error while handling your request");
    }

    return res.status(200).send(invite);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get created invitation tokens
// @route   GET /api/school/:id/invitation
// @access  Private
export const getInvitationTokens = async (req: Request, res: Response) => {
  try {
    const invitations = await db.inviteToken.findMany({
      where: {
        schoolId: req.params.id,
      },
    });

    return res.status(200).send(invitations);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Delete an invitation token
// @route   DELETE /api/school/:id/invitation/:tokenId
// @access  Private
export const deleteInvitationToken = async (req: Request, res: Response) => {
  try {
    const isTokenOwnedBySchool = await db.inviteToken.findUnique({
      where: {
        id: Number(req.params.tokenId),
      },
    });

    if (isTokenOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const invitation = await db.inviteToken.delete({
      where: {
        id: Number(req.params.tokenId),
      },
    });

    return res.status(200).send(invitation);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Accept invitation
// @route   POST /api/invite/:inviteToken
// @access  Private
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const inviteToken = req.params.inviteToken;

    const doesInviteExist = await db.inviteToken.findUnique({
      where: {
        token: inviteToken,
      },
    });

    if (!doesInviteExist) {
      return res.status(404).send("Invitation not found");
    }

    const isUserInSchool = await db.memberOnSchools.findFirst({
      where: {
        userId: req.user.id,
        schoolId: doesInviteExist.schoolId,
      },
    });

    if (!!isUserInSchool) {
      return res.status(403).send("You are already in this school");
    }

    const doesUserHaveAddmission = await db.inviteAdmission.findFirst({
      where: {
        userId: req.user.id,
        schoolId: doesInviteExist.schoolId,
        status: "PENDING",
      },
    });

    if (!!doesUserHaveAddmission) {
      return res.status(403).send("You already sent an admission request to this school");
    }

    const admission = await db.inviteAdmission.create({
      data: {
        userId: req.user.id,
        token: doesInviteExist.token,
        schoolId: doesInviteExist.schoolId,
        role: doesInviteExist.role,
      },
    });

    return res.status(200).send(admission);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get school invite admissions
// @route   GET /api/school/:id/admission
// @access  Private
export const getAdmissions = async (req: Request, res: Response) => {
  try {
    const admissions = await db.inviteAdmission.findMany({
      where: {
        schoolId: req.params.id,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).send(admissions);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Approve or reject admission
// @route   POST /api/school/:id/admission/:admissionId/review
// @access  Private
export const admissionReview = async (req: Request, res: Response) => {
  try {
    const isAdmissionOwnedBySchool = await db.inviteAdmission.findUnique({
      where: {
        id: Number(req.params.admissionId),
      },
    });

    if (isAdmissionOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).send("Missing required fields");
    }

    if (status.toLowerCase() != "accept" && status.toLowerCase() != "reject") {
      return res.status(400).send("Invalid status");
    }

    if (isAdmissionOwnedBySchool.status == "ACCEPTED") {
      return res.status(400).send("User is already in this school");
    }

    const statusEnum = status.toLowerCase() == "accept" ? "ACCEPTED" : "REJECTED";

    const admission = await db.inviteAdmission.update({
      where: {
        id: isAdmissionOwnedBySchool.id,
      },
      data: {
        status: statusEnum,
      },
    });

    if (status.toLowerCase() == "accept") {
      await db.memberOnSchools.create({
        data: {
          userId: isAdmissionOwnedBySchool.userId,
          schoolId: isAdmissionOwnedBySchool.schoolId,
          role: isAdmissionOwnedBySchool.role,
        },
      });
    }

    return res.status(200).send(admission);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Remove members from a school
// @route   DELETE /api/school/:id/member
// @access  Private
export const removeFromSchool = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!userIds) {
      return res.status(400).send("Missing required fields");
    }

    if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "number")) {
      return res.status(400).send("Invalid user ids");
    }

    const schoolMembers = await db.memberOnSchools.findMany({
      where: {
        userId: {
          in: userIds,
        },
        schoolId: req.params.id,
      },
    });

    if (schoolMembers.length != userIds.length) {
      return res
        .status(404)
        .send("A user or some users provided are not in that school or not found");
    }

    const removedSchoolMembers = await db.memberOnSchools.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
        schoolId: req.params.id,
      },
    });

    return res.status(200).json(removedSchoolMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

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

// @desc    Edit school information
// @route   PUT /api/school/:id
// @access  Private
export const editSchool = async (req: Request, res: Response) => {
  try {
    const { name, description, logoUrl } = req.body;

    if (!name || (!description && description != null) || (!logoUrl && logoUrl != null)) {
      return res.status(400).send("Missing required fields");
    }

    if (
      !logoUrl.startsWith(
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`
      )
    ) {
      return res.status(400).send("Invalid file url");
    }

    let publicId = logoUrl.split("/").pop();
    let url;

    try {
      const cloudinaryRes = await axios.get(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`,
        {
          auth: {
            username: process.env.CLOUDINARY_API_KEY || "",
            password: process.env.CLOUDINARY_API_SECRET || "",
          },
        }
      );

      url = cloudinaryRes.data.secure_url;
    } catch {
      return res.status(404).send("File not found in cloudinary");
    }

    const school = await db.school.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
        logoUrl: url,
        description,
      },
    });

    return res.status(200).json(school);
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

// @desc    Delete a school
// @route   DELETE /api/school/:id
// @access  Private
export const deleteSchool = async (req: Request, res: Response) => {
  try {
    if (req.user.role != "SUPER_ADMIN") {
      return res.status(403).send("Forbidden");
    }

    const school = await db.school.delete({
      where: {
        id: req.params.id,
      },
    });

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

    const pendingAdmissions = await db.inviteAdmission.findMany({
      where: {
        userId: req.user.id,
        status: "PENDING",
      },
      include: {
        school: true,
      },
    });

    const filteredPendingAdmissions = pendingAdmissions.map((admission) => {
      return {
        school: admission.school,
      };
    });

    const response = { joined: schools, pending: filteredPendingAdmissions };

    return res.status(200).json(response);
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
        topics: {
          create: {
            name: "Topic 1",
          },
        },
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
          include: {
            user: {
              select: {
                id: true,
                avatarUrl: true,
                fullName: true,
                email: true,
                groups: {
                  select: {
                    group: {
                      select: {
                        id: true,
                        name: true,
                        parentId: true,
                      },
                    },
                  },
                },
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
      role: req.user.role,
      users: subject.users.map((user) => {
        const { groups, ...rest } = user.user;

        const data = {
          ...rest,
          role: user.role,
        };

        if (req.user.isAdmin || isSubjectMember?.role == SubjectRole.TEACHER) {
          Object.assign(data, {
            groups: user.user.groups.map((group) => {
              return {
                ...group.group,
              };
            }),
          });
        }

        return data;
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

// @desc    Assign members to a subject
// @route   POST /api/school/:id/subject/:subjectId/member
// @access  Private
export const assignToSubject = async (req: Request, res: Response) => {
  try {
    const isSubjectOwnedBySchool = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });

    if (isSubjectOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { userIds, as } = req.body;

    if (!userIds || !as) {
      return res.status(400).send("Missing required fields");
    }

    if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "number")) {
      return res.status(400).send("Invalid user ids");
    }

    if (as.toLowerCase() != "student" && as.toLowerCase() != "teacher") {
      return res.status(400).send("Invalid user role");
    }

    let acceptedRoles: Role[] = [Role.STUDENT];
    if (as.toLowerCase() == "teacher") {
      const roles = [Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN];
      acceptedRoles = roles;
    }

    const schoolMembers = await db.memberOnSchools.findMany({
      where: {
        userId: {
          in: userIds,
        },
        role: {
          in: acceptedRoles,
        },
        schoolId: req.params.id,
      },
    });

    if (schoolMembers.length != userIds.length) {
      return res.status(404).send("User not found");
    }

    const alreadySubjectMembers = await db.memberOnSubject.findMany({
      where: {
        userId: {
          in: userIds,
        },
        subjectId: Number(req.params.subjectId),
        schoolId: req.params.id,
      },
    });

    const userIdsWithoutAlreadyAssigned = userIds.filter(
      (userId) => !alreadySubjectMembers.some((member) => member.userId == userId)
    );

    console.log(userIdsWithoutAlreadyAssigned);

    const subjectMembers = await db.memberOnSubject.createMany({
      data: userIdsWithoutAlreadyAssigned.map((userId) => {
        return {
          userId,
          schoolId: req.params.id,
          subjectId: Number(req.params.subjectId),
          role: as.toLowerCase() == "student" ? SubjectRole.STUDENT : SubjectRole.TEACHER,
        };
      }),
    });

    return res.status(200).json(subjectMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Un Assign members from a subject
// @route   DELETE /api/school/:id/subject/:subjectId/member
// @access  Private
export const unAssignFromSubject = async (req: Request, res: Response) => {
  try {
    const isSubjectOwnedBySchool = await db.subject.findUnique({
      where: {
        id: Number(req.params.subjectId),
      },
    });

    if (isSubjectOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { userIds } = req.body;

    if (!userIds) {
      return res.status(400).send("Missing required fields");
    }

    if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "number")) {
      return res.status(400).send("Invalid user ids");
    }

    const subjectMembers = await db.memberOnSubject.findMany({
      where: {
        userId: {
          in: userIds,
        },
        subjectId: Number(req.params.subjectId),
        schoolId: req.params.id,
      },
    });

    if (subjectMembers.length != userIds.length) {
      return res
        .status(404)
        .send(
          "A user or some users provided are not assigned in that subject or not found"
        );
    }

    const deletedSubjectMembers = await db.memberOnSubject.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
        subjectId: Number(req.params.subjectId),
      },
    });

    return res.status(200).json(deletedSubjectMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Create a topic
// @route   POST /api/school/:id/subject/:subjectId/topic
// @access  Private
export const createTopic = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (
      !req.user.isAdmin &&
      (!isSubjectMember || isSubjectMember?.role != SubjectRole.TEACHER)
    ) {
      return res.status(403).send("Forbidden");
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const topic = await db.topic.create({
      data: {
        name,
        subjectId: Number(req.params.subjectId),
      },
    });

    return res.status(201).json(topic);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Edit a topic
// @route   PUT /api/school/:id/subject/:subjectId/topic/:topicId
// @access  Private
export const editTopic = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && isSubjectMember?.role != SubjectRole.TEACHER) {
      return res.status(403).send("Forbidden");
    }

    const isTopicOwnedBySubject = await db.topic.findUnique({
      where: {
        id: Number(req.params.topicId),
      },
    });

    if (isTopicOwnedBySubject?.subjectId != Number(req.params.subjectId)) {
      return res.status(403).send("Forbidden");
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const topic = await db.topic.update({
      where: {
        id: Number(req.params.topicId),
      },
      data: {
        name,
      },
    });

    return res.status(200).json(topic);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Delete a topic
// @route   DELETE /api/school/:id/subject/:subjectId/topic/:topicId
// @access  Private
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && isSubjectMember?.role != SubjectRole.TEACHER) {
      return res.status(403).send("Forbidden");
    }

    const isTopicOwnedBySubject = await db.topic.findUnique({
      where: {
        id: Number(req.params.topicId),
      },
    });

    if (isTopicOwnedBySubject?.subjectId != Number(req.params.subjectId)) {
      return res.status(403).send("Forbidden");
    }

    const documents = await db.document.findMany({
      where: {
        topicId: Number(req.params.topicId),
      },
    });

    for (const document of documents) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const publicId = document.publicId;

        await axios.post(
          `https://api.cloudinary.com/v1_1/${
            process.env.CLOUDINARY_CLOUD_NAME
          }/${document.type.toLowerCase()}/destroy`,
          {
            public_id: publicId,
            api_key: process.env.CLOUDINARY_API_KEY,
            timestamp,
            signature: generateSignature(publicId, timestamp),
          }
        );
      } catch {}
    }

    const topic = await db.topic.delete({
      where: {
        id: Number(req.params.topicId),
      },
    });

    return res.status(200).json(topic);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Create an document
// @route   POST /api/school/:id/subject/:subjectId/topic/:topicId/document
// @access  Private
export const addDocument = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && isSubjectMember?.role != SubjectRole.TEACHER) {
      return res.status(403).send("Forbidden");
    }

    const isTopicOwnedBySubject = await db.topic.findUnique({
      where: {
        id: Number(req.params.topicId),
      },
    });

    if (isTopicOwnedBySubject?.subjectId != Number(req.params.subjectId)) {
      return res.status(403).send("Forbidden");
    }

    const { name, url }: { name: string; url: string } = req.body;

    if (!name || !url) {
      return res.status(400).send("Missing required fields");
    }

    if (
      !url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`)
    ) {
      return res.status(400).send("Invalid file url");
    }

    const publicIdAndFormat = url.split("/").pop();

    if (!publicIdAndFormat) {
      return res.status(400).send("Invalid file url");
    }

    let resourceType: "IMAGE" | "VIDEO" | "RAW";
    let publicId = publicIdAndFormat.split(".")[0];
    let format = publicIdAndFormat.split(".")[1];

    if (format == "png" || format == "jpg" || format == "jpeg") {
      resourceType = "IMAGE";
    } else if (
      format == "mp4" ||
      format == "webm" ||
      format == "ogg" ||
      format == "mov"
    ) {
      resourceType = "VIDEO";
    } else {
      resourceType = "RAW";
      publicId = publicId + "." + format;
    }

    let public_url;
    try {
      const cloudinaryRes = await axios.get(
        `https://api.cloudinary.com/v1_1/${
          process.env.CLOUDINARY_CLOUD_NAME
        }/resources/${resourceType.toLowerCase()}/upload/${publicId}`,
        {
          auth: {
            username: process.env.CLOUDINARY_API_KEY || "",
            password: process.env.CLOUDINARY_API_SECRET || "",
          },
        }
      );

      public_url = cloudinaryRes.data.secure_url;
      format = cloudinaryRes.data.format;
      resourceType = cloudinaryRes.data.resource_type.toUpperCase();
      publicId = cloudinaryRes.data.public_id;

      if (resourceType == "RAW") {
        format = public_url.split("/").pop().split(".").pop();
      }
    } catch (error) {
      return res.status(404).send(error);
    }

    const document = await db.document.create({
      data: {
        name,
        url: public_url,
        topicId: Number(req.params.topicId),
        format,
        type: resourceType,
        publicId,
      },
    });

    return res.status(201).json(document);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Edit a document
// @route   PUT /api/school/:id/subject/:subjectId/topic/:topicId/document/:documentId
// @access  Private
export const editDocument = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && isSubjectMember?.role != SubjectRole.TEACHER) {
      return res.status(403).send("Forbidden");
    }

    const isTopicOwnedBySubject = await db.topic.findUnique({
      where: {
        id: Number(req.params.topicId),
      },
    });

    if (isTopicOwnedBySubject?.subjectId != Number(req.params.subjectId)) {
      return res.status(403).send("Forbidden");
    }

    const document = await db.document.findUnique({
      where: {
        id: Number(req.params.documentId),
      },
    });

    if (document?.topicId != Number(req.params.topicId)) {
      return res.status(403).send("Forbidden");
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const editedDocument = await db.document.update({
      where: {
        id: document.id,
      },
      data: {
        name,
      },
    });

    return res.status(200).json(editedDocument);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/school/:id/subject/:subjectId/topic/:topicId/document/:documentId
// @access  Private
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const isSubjectMember = await db.memberOnSubject.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
        subjectId: Number(req.params.subjectId),
      },
    });

    if (!req.user.isAdmin && isSubjectMember?.role != SubjectRole.TEACHER) {
      return res.status(403).send("Forbidden");
    }

    const isTopicOwnedBySubject = await db.topic.findUnique({
      where: {
        id: Number(req.params.topicId),
      },
    });

    if (isTopicOwnedBySubject?.subjectId != Number(req.params.subjectId)) {
      return res.status(403).send("Forbidden");
    }

    const document = await db.document.findUnique({
      where: {
        id: Number(req.params.documentId),
      },
    });

    if (document?.topicId != Number(req.params.topicId)) {
      return res.status(403).send("Forbidden");
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = document.publicId;

      await axios.post(
        `https://api.cloudinary.com/v1_1/${
          process.env.CLOUDINARY_CLOUD_NAME
        }/${document.type.toLowerCase()}/destroy`,
        {
          public_id: publicId,
          api_key: process.env.CLOUDINARY_API_KEY,
          timestamp,
          signature: generateSignature(publicId, timestamp),
        }
      );
    } catch {}

    const deletedDocument = await db.document.delete({
      where: {
        id: document.id,
      },
    });

    return res.status(200).json(deletedDocument);
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
            groups: {
              select: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    parentId: true,
                  },
                },
              },
            },
          },
        },
        role: true,
      },
    });

    const filteredMembers = members.map((member) => {
      return {
        ...member.user,
        role: member.role,
        groups: member.user.groups.map((group) => {
          return {
            ...group.group,
          };
        }),
      };
    });

    return res.status(200).json(filteredMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get all groups
// @route   GET /api/school/:id/group
// @access  Private
export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await db.group.findMany({
      where: {
        schoolId: req.params.id,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return res.status(200).json(groups);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get all group members
// @route   GET /api/school/:id/group/:groupId/member
// @access  Private
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const group = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                avatarUrl: true,
                fullName: true,
                email: true,
                schools: {
                  where: {
                    schoolId: req.params.id,
                  },
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).send("Group not found");
    }

    if (group?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    let members: any[] = [];
    async function getGroupMembers(groupId: number) {
      const childGroups = await db.group.findMany({
        where: {
          parentId: groupId,
        },
        include: {
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  avatarUrl: true,
                  fullName: true,
                  email: true,
                  schools: {
                    where: {
                      schoolId: req.params.id,
                    },
                    select: {
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const group of childGroups) {
        group.members.forEach((member) => {
          const isUserInArray = members.find((m) => m.id == member.user.id);

          if (isUserInArray) {
            return;
          }

          const { schools, ...rest } = member.user;

          const role = member.user.schools[0]?.role || null;

          members.push({ ...rest, role });
        });
        await getGroupMembers(group.id);
      }
    }

    await group?.members.forEach((member) => {
      const { schools, ...rest } = member.user;

      const role = member.user.schools[0]?.role || null;

      members.push({ ...rest, role });
    });

    await getGroupMembers(Number(req.params.groupId));

    const response = {
      ...group,
      members,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Create a group
// @route   POST /api/school/:id/group
// @access  Private
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).send("Missing required fields");
    }

    const group = await db.group.create({
      data: {
        name,
        parentId,
        schoolId: req.params.id,
      },
    });

    return res.status(201).json(group);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Edit a group
// @route   PUT /api/school/:id/group/:groupId
// @access  Private
export const editGroup = async (req: Request, res: Response) => {
  try {
    const isGroupOwnedBySchool = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
    });

    if (isGroupOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { name, parentId } = req.body;

    if (!name && !parentId && parentId != null) {
      return res.status(400).send("Missing required fields");
    }

    let groupName = isGroupOwnedBySchool.name;
    let groupParentId = isGroupOwnedBySchool.parentId;

    if (!!name) {
      groupName = name;
    }

    if (!!parentId || parentId == null) {
      groupParentId = parentId;
    }

    // If the parent group is changed, check if the new parent group is a child of the group
    if (parentId != null && parentId != isGroupOwnedBySchool.parentId) {
      const childGroupIds: number[] = [];
      let isNewParentGroupChild = false;

      async function checkParentGroupChild(groupId: number) {
        const childGroups = await db.group.findMany({
          where: {
            parentId: groupId,
          },
        });

        for (const group of childGroups) {
          // Save the first generation child group ids
          if (group.parentId == isGroupOwnedBySchool?.id) {
            childGroupIds.push(group.id);
          }

          // Check if the new parent group is a child of the group
          if (group.id == parentId) {
            isNewParentGroupChild = true;
          }

          await checkParentGroupChild(group.id);
        }
      }

      await checkParentGroupChild(isGroupOwnedBySchool.id);

      // If the new parent group is a child of the group, remove the children groups relationship
      if (isNewParentGroupChild) {
        await db.group.updateMany({
          where: {
            id: {
              in: childGroupIds,
            },
          },
          data: {
            parentId: null,
          },
        });
      }
    }

    const group = await db.group.update({
      where: {
        id: Number(req.params.groupId),
      },
      data: {
        name: groupName,
        parentId: groupParentId,
      },
    });

    return res.status(200).json(group);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Get a group
// @route   GET /api/school/:id/group/:groupId
// @access  Private
export const getGroup = async (req: Request, res: Response) => {
  try {
    const group = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                avatarUrl: true,
                fullName: true,
                email: true,
                schools: {
                  where: {
                    schoolId: req.params.id,
                  },
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (group?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const filteredMembers = group.members.map((member) => {
      const { schools, ...rest } = member.user;

      return {
        ...rest,
        role: member.user.schools[0].role,
      };
    });

    const { members, ...rest } = group;

    return res.status(200).json({ ...rest, members: filteredMembers });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Delete a group
// @route   DELETE /api/school/:id/group/:groupId
// @access  Private
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const isGroupOwnedBySchool = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
    });

    if (isGroupOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const group = await db.group.delete({
      where: {
        id: Number(req.params.groupId),
      },
    });

    return res.status(200).json(group);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Assign members to a group
// @route   POST /api/school/:id/group/:groupId/member
// @access  Private
export const assignToGroup = async (req: Request, res: Response) => {
  try {
    const isGroupOwnedBySchool = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
    });

    if (isGroupOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { userIds } = req.body;

    if (!userIds) {
      return res.status(400).send("Missing required fields");
    }

    if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "number")) {
      return res.status(400).send("Invalid user ids");
    }

    const schoolMembers = await db.memberOnSchools.findMany({
      where: {
        userId: {
          in: userIds,
        },
        schoolId: req.params.id,
      },
    });

    if (schoolMembers.length != userIds.length) {
      return res.status(404).send("User not found");
    }

    // get all group parents and parents of parents ids
    const groupParents: number[] = [];
    groupParents.push(isGroupOwnedBySchool.id);

    async function getGroupParents(groupId: number) {
      const group = await db.group.findUnique({
        where: {
          id: groupId,
        },
      });

      if (!group) {
        return;
      }

      groupParents.push(group?.id);

      if (!!group?.parentId) {
        await getGroupParents(group.parentId);
      }
    }

    if (!!isGroupOwnedBySchool.parentId) {
      await getGroupParents(isGroupOwnedBySchool.parentId);
    }

    const data = userIds.flatMap((userId) =>
      groupParents.map((groupId) => ({ userId, groupId }))
    );

    const groupMembers = await db.memberOnGroup.createMany({
      data,
      skipDuplicates: true,
    });

    return res.status(200).json(groupMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};

// @desc    Un Assign members from a group
// @route   DELETE /api/school/:id/group/:groupId/member
// @access  Private
export const unAssignFromGroup = async (req: Request, res: Response) => {
  try {
    const isGroupOwnedBySchool = await db.group.findUnique({
      where: {
        id: Number(req.params.groupId),
      },
    });

    if (isGroupOwnedBySchool?.schoolId != req.params.id) {
      return res.status(403).send("Forbidden");
    }

    const { userIds } = req.body;

    if (!userIds) {
      return res.status(400).send("Missing required fields");
    }

    if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "number")) {
      return res.status(400).send("Invalid user ids");
    }

    const schoolMembers = await db.memberOnSchools.findMany({
      where: {
        userId: {
          in: userIds,
        },
        schoolId: req.params.id,
      },
    });

    if (schoolMembers.length != userIds.length) {
      return res.status(404).send("User not found");
    }

    const groupMembers = await db.memberOnGroup.findMany({
      where: {
        userId: {
          in: userIds,
        },
        groupId: Number(req.params.groupId),
      },
    });

    if (groupMembers.length != userIds.length) {
      return res.status(400).send("User is not in that group");
    }

    const deletedGroupMembers = await db.memberOnGroup.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
        groupId: Number(req.params.groupId),
      },
    });

    return res.status(200).json(deletedGroupMembers);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
};
