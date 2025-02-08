import { Request, Response, NextFunction } from "express";
import db from "../lib/db";

export const admin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSchoolAdmin = await db.memberOnSchools.findFirst({
      where: {
        userId: req.user.id,
        schoolId: req.params.id,
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

    next();
  } catch (error: any) {
    return res.status(500).send("Internal Error");
  }
};
