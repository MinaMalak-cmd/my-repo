import slugify from "slugify";
import productModel from "../../../../DB/models/product.model.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import { generateRandomString } from "../../../utils/stringMethods.js";
import categoryModel from "../../../../DB/models/category.model.js";
import subCategoryModel from "../../../../DB/models/subcategory.model.js";
import brandModel from "../../../../DB/models/brand.model.js";
import cloudinary from "../../../utils/cloudinaryConfigurations.js";
import { ApiFeatures } from "../../../utils/apiFeaturesClass.js";

export const addProduct = asyncHandler(async (req, res, next) => {
  let { title, description, colors, sizes, price, appliedDiscount, stock } =
    req.body;
  const { categoryId, subCategoryId, brandId, createdBy } = req.query;
  title = title.toLowerCase();
  if (!req.files.length) {
    return next(new Error("Please upload product images", { cause: 400 }));
  }
  const isTitleDuplicated = await productModel.findOne({ title });
  if (isTitleDuplicated) {
    return next(
      new Error("Please enter different product name", { cause: 400 })
    );
  }
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("Category doesn't exist", { cause: 400 }));
  }
  const subCategory = await subCategoryModel.findById(subCategoryId);
  if (!subCategory) {
    return next(new Error("Sub Category doesn't exist", { cause: 400 }));
  }
  const brand = await brandModel.findById(brandId);
  if (!brand) {
    return next(new Error("Brand doesn't exist", { cause: 400 }));
  }
  const slug = slugify(title, {
    replacement: "_",
    lower: true,
    trim: true,
  });
  const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100);

  // Images
  const customId = generateRandomString();
  const customPath = `${brand.customPath}/Products/${customId}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const Images = [];
  req.imgPath = customPath;
  for (let file of req.files) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: customPath,
      }
    );
    Images.push({ public_id, secure_url });
  }
  const productObject = {
    title,
    slug,
    description,
    price,
    priceAfterDiscount,
    appliedDiscount,
    stock,
    Images,
    customPath,
    colors,
    sizes,
    subCategoryId,
    categoryId,
    brandId,
  };
  const product = await productModel.create(productObject);
  if (!product) {
    await cloudinary.api.delete_resources_by_prefix(customPath);
    await cloudinary.api.delete_folder(customPath);
    return next(new Error("You can't add this resource", { cause: 500 }));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  return SuccessResponse(
    res,
    { message: "Product created successfully", statusCode: 230, product },
    201
  );
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  let { title, description, colors, sizes, price, appliedDiscount, stock } =
    req.body;
  const { categoryId, subCategoryId, brandId, createdBy } = req.query;
  const { id } = req.params;
  const product = await productModel.findById(id); //TODO: convert to findOne and owner
  if (!product) {
    return next(new Error("invalid product", { cause: 400 }));
  }
  //=============================== Ids Checks======================
  const category = await categoryModel.findById(
    categoryId || product.categoryId
  );
  if (!category) {
    return next(new Error("Category doesn't exist", { cause: 400 }));
  }
  if (categoryId) {
    product.categoryId = categoryId;
  }
  const subCategory = await subCategoryModel.findById(
    subCategoryId || product.subCategoryId
  );
  if (!subCategory) {
    return next(new Error("Sub Category doesn't exist", { cause: 400 }));
  }
  if (subCategory) {
    product.subCategory = subCategory;
  }
  const brand = await brandModel.findById(brandId || product.brandId);
  if (!brand) {
    return next(new Error("Brand doesn't exist", { cause: 400 }));
  }
  if (brandId) {
    product.brandId = brandId;
  }
  if (title) {
    title = title.toLowerCase();
    const isTitleDuplicated = await productModel.findOne({ title });
    if (isTitleDuplicated) {
      return next(
        new Error("Please enter different product name", { cause: 400 })
      );
    }
    product.title = title;
    product.slug = slugify(title, "_");
  }
  if (description) product.description = description;
  if (stock) product.stock = stock;
  if (colors) product.colors = colors;
  if (sizes) product.sizes = sizes;
  let priceAfterDiscount;
  if (price && appliedDiscount) {
    priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100);
    product.price = price;
    product.priceAfterDiscount = priceAfterDiscount;
    product.appliedDiscount = appliedDiscount;
  } else if (price) {
    priceAfterDiscount = price * (1 - (product.appliedDiscount || 0) / 100);
    product.price = price;
    product.priceAfterDiscount = priceAfterDiscount;
  } else if (appliedDiscount) {
    priceAfterDiscount = product.price * (1 - (appliedDiscount || 0) / 100);
    product.priceAfterDiscount = priceAfterDiscount;
    product.appliedDiscount = appliedDiscount;
  }

  // Images
  if (req.files.length) {
    const customPath = product.customPath;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const Images = [];
    req.imgPath = customPath;
    for (let file of req.files) {
      const { public_id, secure_url } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: customPath,
        }
      );
      Images.push({ public_id, secure_url });
      product.Images = Images;
    }
  }
  await product.save();
  return SuccessResponse(
    res,
    { message: "Product Updated successfully", statusCode: 235, product },
    200
  );
});

export const getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await productModel.find().populate([
    { path: "categoryId", select: "name -_id" },
    { path: "subCategoryId", select: "name -_id" },
    { path: "brandId", select: "name -_id" },
  ]);
  return products
    ? SuccessResponse(
        res,
        {
          message: "products retrieved successfully",
          statusCode: 200,
          products,
        },
        200
      )
    : next(new Error("Can't get All products", { cause: 400 }));
});
export const getSelectedProducts = asyncHandler(async (req, res, next) => {
  const { page, size, sort, select, search, ...filter } = req.query;
  // .select(select?.replaceAll(',', ' ')).limit(limit).skip(skip).sort(sort?.replaceAll(',',' '));
  // send sort in this format -stock,-price As -stock -price space will be replaced by %$ in url
  // which make url unreadable

  // to translate request price: { eq: '110' } to this format you must write it in postman as following : price[eq] in key, and 110 in value 
``// const queryFilter = JSON.parse(JSON.stringify(filter).replace(/gt|gte|lt|lte|in|nin|regex|eq|neq/g,(match) => `$${match}`));
  
  const apiFeatureInstance = new ApiFeatures(productModel.find(), req.query).pagination().filter().sort().select();
  const products = await apiFeatureInstance.mongooseQuery;
  return products
    ? SuccessResponse(
        res,
        {
          message: "products retrieved successfully",
          statusCode: 200,
          products
        },
        200
      )
    : next(new Error("Can't get All products", { cause: 400 }));
});
