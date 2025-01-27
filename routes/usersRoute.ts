import express from "express";
import {
  activateAccount,
  registerUser,
  loginUser,
  getUser,
  authorizeUserWithProvider,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/oauth", authorizeUserWithProvider);
router.post("/login", loginUser);

router.post("/activate/:token", activateAccount);
router.get("/me", protect, getUser);

export default router;
