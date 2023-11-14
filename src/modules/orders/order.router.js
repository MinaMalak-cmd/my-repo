import express, { Router } from 'express';
import * as orderController from "./controllers/order.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import handleAuth from "../../../middlewares/handleAuth.js";
import { systemRoles } from "../../utils/constants.js";
import handleUserRole from "../../../middlewares/handleUserRole.js";
import handleCouponValidate from "../../../middlewares/handleCouponValidate.js";
const router = Router();

router.post('/', handleAuth, handleUserRole([systemRoles.USER]), handleCouponValidate, orderController.addOrder);
router.post('/from-cart', handleAuth, handleUserRole([systemRoles.USER]), handleCouponValidate, orderController.formCartToOrder);
router.get('/', handleAuth, handleUserRole([systemRoles.VENDOR, systemRoles.SUPER_ADMIN]), orderController.getAllOrders);
// router.post('/webhook', express.raw({type : 'application/json'}) ,orderController.successPayment)
// it should be post endpoints not get
router.get('/successPayment/:token', orderController.successPayment)
router.get('/cancelPayment/:token', orderController.cancelPayment)
// router.delete('/:id', handleAuth, validation(orderValidators.deleteOrder), orderController.deleteOrder);


export default router;
