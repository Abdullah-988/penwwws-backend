import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../lib/db";

interface JWTPayload {
  schoolId: string;
}

export const device = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      if (!decoded.schoolId) {
        return res.status(401).send("Unauthorized");
      }

      // Get user from the token
      const school = await db.school.findUnique({
        where: {
          id: decoded.schoolId,
        },
      });

      if (!school) {
        return res.status(401).send("Unauthorized");
      }

      req.school = school;

      next();
    } catch (error: any) {
      return res.status(401).send("Unauthorized");
    }
  }

  if (!token) {
    return res.status(401).send("Unauthorized, no token");
  }
};
