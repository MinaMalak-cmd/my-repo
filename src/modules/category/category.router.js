import { Router } from "express";
import * as categoryController from "./controllers/category.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import * as categoryValidators from "../../../middlewares/validations/category.validation.js";
import { uploadCloudinary } from "../../services/uploadCloudinary.js";
import handleAuth from "../../../middlewares/handleAuth.js";

const router = Router();

router.post('/', handleAuth ,uploadCloudinary().single('image'), validation(categoryValidators.addCategory), categoryController.addCategory);
router.put('/:id', uploadCloudinary().single('image'), validation(categoryValidators.updateCategory), categoryController.updateCategory);
router.delete('/:id', validation(categoryValidators.deleteCategory), categoryController.deleteCategory);
router.get('/',  categoryController.getAllCategories);

export default router;
