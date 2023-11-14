import Joi from "joi";
import { generalFields } from "./validation.js";


export const addCart = {
  body: Joi.object({
    products: Joi.array().items(generalFields.productInCart).required()
  }).options({ presence: "required" }),

};


