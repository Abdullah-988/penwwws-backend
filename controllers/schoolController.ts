import { Request, Response } from "express";
import db from "../lib/db";

// @desc    Get school data
// @route   GET /api/school/:id
// @access  Private
export const getSchool = async (req: Request, res: Response) => {
  try {
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
