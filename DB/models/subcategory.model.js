import mongoose, { Schema, Types, model } from "mongoose";

const subCategorySchema = new Schema(
  {
    name: {
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
    image: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: false, // TODO: convert into true after creating usermodel
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    customPath: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true } // So `console.log()` and other functions that use `toObject()` include virtuals
  }
);

subCategorySchema.virtual('brands', {
  ref: 'Brand',
  localField: '_id',
  foreignField: 'subCategoryId'
});

const subCategoryModel = mongoose.models["subCategory"] || model("subCategory", subCategorySchema);

export default subCategoryModel;
