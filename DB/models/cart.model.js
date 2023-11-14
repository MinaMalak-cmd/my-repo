import mongoose, { Schema, Types, model } from "mongoose";

const cartSchema = new Schema(
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
      }
    ], 
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    
  },
  {
    timestamps: true,
  }
);

const cartModel =
  mongoose.models["Cart"] || model("Cart", cartSchema);

export default cartModel;
