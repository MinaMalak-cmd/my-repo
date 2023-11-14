import mongoose, { Schema, Types, model } from "mongoose";
import { orderStatus, paymentMethods } from "../../src/utils/constants.js";

const orderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: false, // TODO: convert into true after creating usermodel
    },
    products: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        finalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    couponId: {
      type: Types.ObjectId,
      ref: "Coupon",
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    phoneNumbers : [{
      type:String,
      required: true,
    }],
    paymentMethod : {
      type: String,
      required: true,
      enum : [paymentMethods.CARD, paymentMethods.CASH]
    },

    orderStatus : {
      type: String,
      required: true,
      enum : [...Object.values(orderStatus)]
    }
  },
  {
    timestamps: true,
  }
);

const orderModel = mongoose.models["Order"] || model("Order", orderSchema);

export default orderModel;
