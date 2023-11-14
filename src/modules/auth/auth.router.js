import { Router } from "express";
import * as authController from "./controllers/auth.js";
import * as validators from "../../../middlewares/validations/auth.validation.js";
import { validation } from "../../../middlewares/validations/validation.js";

const router = Router();

router.post("/signup", validation(validators.signup), authController.signup);
router.get("/users", authController.getAllUsers);
router.patch("/change-password", validation(validators.changePassword), authController.changePassword);
router.post("/login", validation(validators.login), authController.login);
router.get("/confirm-email/:token", authController.confirmEmail);
router.get("/new-confirm-email/:token", authController.newConfirmEmail);
router.get("/unsubscribe/:token", authController.unSubscribe);
router.post("/forget-password", validation(validators.forgetPassword), authController.forgetPassword);
router.post('/google', authController.loginWithGmail);
export default router;