import mongoose, { Schema, Types, model } from "mongoose";
import subCategoryModel from "./subcategory.model.js";
import brandModel from "./brand.model.js";
import productModel from "./product.model.js";

const categorySchema = new Schema(
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
    customId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true } // So `console.log()` and other functions that use `toObject()` include virtuals
  }
);
categorySchema.virtual('subCategories', {
  ref: 'subCategory',
  localField: '_id',
  foreignField: 'categoryId'
});

categorySchema.virtual('brands', {
  ref: 'Brand',
  localField: '_id',
  foreignField: 'categoryId'
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId'
});

// categorySchema.post('findOneAndDelete', { document: true, query: true } ,function(next, doc) {
categorySchema.pre('findOneAndDelete', { document: true, query: true } ,async function(next) {
  const categoryId = this?._conditions?._id || 0;
  console.log('Middleware on parent document', categoryId, this); // Will be executed
  try {
    await subCategoryModel.deleteMany({ categoryId: categoryId });
    await brandModel.deleteMany({ categoryId: categoryId });
    await productModel.deleteMany({ categoryId: categoryId });
    next();
  } catch (error) {
    return next(new Error(`${error} from hook part`, { cause: 500 }))
  }
});
const categoryModel = mongoose.models["Category"] || model("Category", categorySchema);

export default categoryModel;
