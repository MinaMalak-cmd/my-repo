import mongoose, { Schema, Types, model } from "mongoose";

const couponSchema = new Schema(
  {
    couponCode: {
      type: String,
      required: [true, "couponCode is required"],
      minLength: 2,
      maxLength: 100,
      lowercase: true,
      trim: true,
      unique: true,
    },
    couponAmount:{
      type:Number,
      required:[true, "couponAmount is required"]
    },
    couponStatus:{
      type:String,
      default: 'valid',
      enum: ['valid', 'expired']
    },
    fromDate:{
      type:String,
      required:[true, "fromDate is required"]
    },
    toDate:{
      type:String,
      required:[true, "fromDate is required"]
    },
    isPercentage:{
      type:Boolean,
      default:false,
    },
    isFixedAmount:{
      type:Boolean,
      default:false,
    },
    couponAssignedToUsers: [
      {
        userId: {
          type: Types.ObjectId,
          ref: "User",
          required: true, 
        },
        maxUsage: {
          type: Number,
          required: true,
        },
        usageCount: {
          type: Number,
          default: 0,
        }
      }
    ], 
  },
  {
    timestamps: true,
  }
);

const couponModel =
  mongoose.models["Coupon"] || model("Coupon", couponSchema);

export default couponModel;
