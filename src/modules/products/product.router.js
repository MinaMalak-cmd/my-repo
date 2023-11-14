import { Router } from "express";
import * as productController from "./controllers/product.controller.js";
import { validation } from "../../../middlewares/validations/validation.js";
import * as productValidators from "../../../middlewares/validations/product.validation.js";
import { uploadCloudinary } from "../../services/uploadCloudinary.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";

const router = Router();

router.post('/', uploadCloudinary(allowedExtensions.Image).array('images',10), validation(productValidators.addProduct), productController.addProduct);
router.put('/:id', uploadCloudinary(allowedExtensions.Image).array('images',10), validation(productValidators.updateProduct), productController.updateProduct);
// router.delete('/:id', validation(productValidators.deleteProduct), productController.deleteProduct);
router.get('/',  productController.getAllProducts);
router.get('/paginated-products',  productController.getSelectedProducts);

export default router;
