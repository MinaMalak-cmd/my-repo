import Joi from 'joi';
import { generalFields } from './validation.js';

export const addCategory  = {
    body : 
        Joi.object({
            name : Joi.string().min(2).max(100).required(),
            createdBy : Joi.string().hex().length(24)
        }).required(),
    file: generalFields.file.required()
}

export const updateCategory = {
    params : Joi.object({
        id : generalFields._id
    }).options({ presence : "required" }),
    body: Joi.object({
        name : Joi.string().min(2).max(100),
        createdBy : Joi.string().hex().length(24)
    }).required(),
    file: generalFields.file,
}

export const deleteCategory = {
    params : Joi.object({
        id : generalFields._id
    }).options({ presence : "required" }),
}
