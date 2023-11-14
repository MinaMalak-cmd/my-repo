import Joi from 'joi';
import { generalFields } from "./validation.js";
import { systemRoles } from "../../src/utils/constants.js";

export const signup = {
    body : 
        Joi.object({
            userName : Joi.string().min(3).max(100).pattern(new RegExp(/[A-Z][a-zA-Z][^#&<>\"~;$^%{}?]{1,20}/)).required(),
            email : Joi.string().email({ tlds: { allow: ['com', 'net', 'eg', 'gov', 'edu']} }).required(),
            password : Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
            cPassword : Joi.string().valid(Joi.ref('password')).required(),
            age: Joi.number().integer().positive().min(3).max(90).required(),
            phone : Joi.string().pattern(new RegExp(/^01[0125][0-9]{8}$/)).required(),
            gender : Joi.string().valid('male', 'female'),
            confirmEmail: Joi.boolean().truthy("1").falsy("0").sensitive(),
            address : Joi.array().items(Joi.string().min(3).max(100)).required(),
            role : Joi.string().valid(...Object.values(systemRoles)).required()
        }),
    files: Joi.object({
        profile : generalFields.file.required(),
        cover: Joi.array().items(generalFields.file.required())
    }).options({presence: "optional"})
    
}


export const login = {
    body : Joi.object({
        userName : Joi.string().min(3).max(100).pattern(new RegExp(/[A-Z][a-zA-Z][^#&<>\"~;$^%{}?]{1,20}/)),
        email : Joi.string().email({ minDomainSegments: 2, maxDomainSegments: 4 ,tlds: { allow: ['com', 'net', 'eg', 'gov', 'edu']} }),
        phone : Joi.string().pattern(new RegExp(/^01[0125][0-9]{8}$/)),
        password : Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    }).required().xor('email', 'userName', 'phone')
}

export const changePassword = {
    body : Joi.object({
        email : Joi.string().email({ minDomainSegments: 2, maxDomainSegments: 4 ,tlds: { allow: ['com', 'net', 'eg', 'gov', 'edu']} }).required(),
        password : Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    }).required()
}

export const forgetPassword = {
    body : Joi.object({
        email : Joi.string().email({ minDomainSegments: 2, maxDomainSegments: 4 ,tlds: { allow: ['com', 'net', 'eg', 'gov', 'edu']} }).required(),
        password : Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    }).required()
}