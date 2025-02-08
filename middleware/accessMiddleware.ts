import { Request, Response, NextFunction } from "express";
import db from "../lib/db";

export const access = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSchoolMember = await db.memberOnSchools.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
      },
    });

    if (!isSchoolMember) {
      return res.status(404).send("Not Found");
    }

    req.user.role = isSchoolMember.role;
    req.user.isAdmin =
      isSchoolMember.role == "SUPER_ADMIN" || isSchoolMember.role == "ADMIN";
    next();
  } catch (error: any) {
    return res.status(500).send("Internal Error");
  }
};
