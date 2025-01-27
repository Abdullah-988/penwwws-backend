import express from "express";
import { getSchool } from "../controllers/schoolController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/school/:id", protect, getSchool);

export default router;
