import { Router } from "express";
import * as brandController from "./controllers/brand.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import * as brandValidators from "../../../middlewares/validations/brand.validation.js";
import { uploadCloudinary } from "../../services/uploadCloudinary.js";

const router = Router();

router.post('/', uploadCloudinary().single('image'), validation(brandValidators.addBrand), brandController.addBrand);
router.put('/:id', uploadCloudinary().single('image'), validation(brandValidators.updateBrand), brandController.updateBrand);
router.delete('/:id', validation(brandValidators.deleteBrand), brandController.deleteBrand);
router.get('/',  brandController.getAllBrands);

export default router;
