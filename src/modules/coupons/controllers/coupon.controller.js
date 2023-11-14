import productModel from "../../../../DB/models/product.model.js";
import couponModel from "../../../../DB/models/coupon.model.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import userModel from "../../../../DB/models/user.model.js";

export const addCoupon = asyncHandler(async (req, res, next) => {
  let {
    couponCode,
    couponAmount,
    couponStatus,
    fromDate,
    toDate,
    couponAssignedToUsers,
    isFixedAmount,
    isPercentage,
  } = req.body;

  //  *********************** coupon code check
  const coupon = await couponModel.findOne({ couponCode });
  if (coupon) {
    return next(new Error("Duplicate coupon code", { cause: 400 }));
  }
  if (isPercentage == isFixedAmount) {
    return next(new Error("Please select one of them", { cause: 400 }));
  }

  if (isPercentage && (couponAmount < 1 || couponAmount > 100)) {
    return next(new Error("Invalid CouponAmount", { cause: 400 }));
  }
  let userArr = [];
  for (const user of couponAssignedToUsers) {
    userArr.push(user.userId);
  }
  const dbCheck = await userModel.find({ _id: { $in: userArr } });
  if (dbCheck.length !== userArr.length) {
    return next(new Error("Invalid userIds", { cause: 400 }));
  }

  const couponObject = {
    couponCode,
    couponAmount,
    couponStatus,
    fromDate,
    toDate,
    couponAssignedToUsers,
    isFixedAmount,
    isPercentage,
  };

  const coupondb = await couponModel.create(couponObject);

  return SuccessResponse(
    res,
    { message: "Coupon created successfully", statusCode: 230, coupondb },
    201
  );
});

export const getAllCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await couponModel.find();

  return coupons
    ? SuccessResponse(
        res,
        {
          message: "coupons retrieved successfully",
          statusCode: 200,
          coupons,
        },
        200
      )
    : next(new Error("Can't get All coupons", { cause: 400 }));
});

export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await couponModel.findOneAndDelete({ _id: id });
  if (!coupon) {
    return next(new Error("Coupon is not found", { cause: 400 }));
  }
  return SuccessResponse(
    res,
    { message: "Coupon deleted successfully", statusCode: 200, coupon },
    200
  );
});
