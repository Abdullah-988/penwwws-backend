import express from "express";
import {
  activateAccount,
  registerUser,
  loginUser,
  getUser,
  authorizeUserWithProvider,
  resetPasswordRequest,
  resetAccountPassword,
  getSchoolUser,
  editUser,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";
import { access } from "../middleware/accessMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/oauth", authorizeUserWithProvider);
router.post("/login", loginUser);

router.post("/user/reset-password", resetPasswordRequest);
router.post("/user/reset-password/:token", resetAccountPassword);

router.post("/activate/:token", activateAccount);
router.get("/me", protect, getUser);
router.put("/me", protect, editUser);
router.get("/me/:id", protect, access, getSchoolUser);

export default router;
