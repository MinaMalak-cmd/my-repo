import Joi from "joi";
import { generalFields } from "./validation.js";

export const addCoupon = {
  body: Joi.object({
    couponCode: Joi.string().min(2).max(100).required(),
    couponAmount: Joi.number().integer().min(1),
    couponStatus: Joi.string().valid("valid", "expired"),
    isPercentage: Joi.boolean(),
    isFixedAmount: Joi.boolean(),
    couponAssignedToUsers: Joi.array()
      .items(generalFields.couponAssignedToUsers)
      .required(),
    fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref("fromDate")).required(),
  }).options({ presence: "required" }),
};

export const updateCoupon = {
  params: Joi.object({
    id: generalFields._id,
  }).options({ presence: "required" }),
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    createdBy: Joi.string().hex().length(24),
  }).required(),
  file: generalFields.file,
};

export const deleteCoupon = {
  params: Joi.object({
    id: generalFields._id,
  }).options({ presence: "required" }),
};
