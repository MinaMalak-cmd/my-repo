import mongoose, { Schema, Types, model } from "mongoose";

const productSchema = new Schema(
  {
    // ======================= Text fields ====================
    title: {
      type: String,
      required: [true, "this is field is required"],
      minLength: 2,
      maxLength: 100,
      lowercase: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      match: /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/,
    },
    description: String,

    // ====================== price ==================
    price: {
      type: Number,
      required: true,
    },
    appliedDiscount: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },

    //====================== quantity ================
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    //====================== images ============
    Images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    customPath: String,

    //==================== Ids ==================
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: false, // TODO: convert into true after creating usermodel
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    subCategoryId: {
      type: Types.ObjectId,
      ref: "subCategory",
      required: true,
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandId: {
      type: Types.ObjectId,
      ref: "Brand",
      required: true,
    },

      //====================== specifictions ==========
      colors: [String],
      sizes: [String],
  },
  {
    timestamps: true,
  }
);

const productModel =
  mongoose.models["Product"] || model("Product", productSchema);

export default productModel;
