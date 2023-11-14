import Joi from 'joi';
import { generalFields } from './validation.js';

export const addSubCategory  = {
    body : 
        Joi.object({
            name : Joi.string().min(2).max(100).required(),
            createdBy : generalFields._id,
            categoryId : generalFields._id.required()
        }).required(),
    file: generalFields.file.required()
}

export const updateSubCategory = {
    params : Joi.object({
        id : generalFields._id
    }).options({ presence : "required" }),
    body: Joi.object({
        name : Joi.string().min(2).max(100),
        createdBy : generalFields._id,
        categoryId : generalFields._id.required()
    }).required(),
    file: generalFields.file,
}

export const deleteSubCategory = {
    params : Joi.object({
        id : generalFields._id
    }).options({ presence : "required" }),
}
