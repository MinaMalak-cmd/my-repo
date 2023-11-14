import { Router } from "express";
import * as cartController from "./controllers/cart.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import handleAuth from "../../../middlewares/handleAuth.js";
import handleUserRole from "../../../middlewares/handleUserRole.js";
import * as cartValidators from "../../../middlewares/validations/cart.validation.js";
import { systemRoles } from "../../utils/constants.js";

const router = Router();

router.post('/', handleAuth, validation(cartValidators.addCart), cartController.addToCart);
router.get('/',  handleAuth, handleUserRole([systemRoles.SUPER_ADMIN]), cartController.getAllCarts);
router.patch('/:productId', handleAuth, handleUserRole([systemRoles.ADMIN, systemRoles.USER]), cartController.deleteFromCart);
router.delete('/', handleAuth, cartController.deleteAllCartsForThisUser);
export default router;
