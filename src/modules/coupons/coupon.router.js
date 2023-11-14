import { Router } from "express";
import * as couponController from "./controllers/coupon.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import handleAuth from "../../../middlewares/handleAuth.js";
import * as couponValidators from "../../../middlewares/validations/coupon.validation.js";

const router = Router();

router.post('/', handleAuth, validation(couponValidators.addCoupon), couponController.addCoupon);
router.get('/',  couponController.getAllCoupons);
router.delete('/:id', handleAuth, validation(couponValidators.deleteCoupon), couponController.deleteCoupon);


export default router;
