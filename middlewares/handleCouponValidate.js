import couponModel from "../DB/models/coupon.model.js";
import { asyncHandler } from "../src/utils/handlers.js";
import moment from "moment-timezone";

const handleCouponValidate = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { couponCode } = req.body;
  if (!couponCode) {
    return next();
  }
  const coupon = await couponModel.findOne({ couponCode });
  if (!coupon) {
    return next(new Error("Coupon isn't existed", { cause: 400 }));
  }
  if (
    coupon.couponStatus !== "valid" ||
    moment(new Date(coupon.toDate)).isBefore(moment())
  ) {
    return next(new Error("Coupon is expired", { cause: 400 }));
  }
  if (moment(new Date(coupon.fromDate)).isAfter(moment())) {
    return next(new Error("Coupon doesn't start yet", { cause: 400 }));
  }

  let isAssigned = false;
  let exceed = false;

  for (const user of coupon.couponAssignedToUsers) {
    if (user.userId.toString() == userId.toString()) {
      isAssigned = true;
      if (user.maxUsage <= user.usageCount) {
        exceed = true;
      }
    }
  }
  if (!isAssigned) {
    return next(new Error("Coupon isn't to you", { cause: 400 }));
  }
  if (exceed) {
    return next(new Error("You exceeded the limit", { cause: 400 }));
  }
  req.coupon = coupon;
  return next();
});

export default handleCouponValidate;
