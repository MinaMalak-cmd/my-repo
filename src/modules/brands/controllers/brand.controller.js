import slugify from "slugify";
import cloudinary from "../../../utils/cloudinaryConfigurations.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import { generateRandomString } from "../../../utils/stringMethods.js";
import categoryModel from "../../../../DB/models/category.model.js";
import subCategoryModel from "../../../../DB/models/subcategory.model.js";
import brandModel from "../../../../DB/models/brand.model.js";

export const addBrand = asyncHandler(async (req, res, next) => {
  // add created by
  let { name, createdBy, categoryId, subCategoryId } = req.body;
  name = name.toLowerCase();
  if (!req.file) {
    return next(new Error("Please upload a brand image", { cause: 400 }));
  }
  const isNameDuplicate = await brandModel.findOne({ name });
  if (isNameDuplicate) {
    return next(
      new Error("Please enter different brand name", { cause: 400 })
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
  const slug = slugify(name, "_");
  const customId = generateRandomString();
  const customPath = `${subCategory.customPath}/Brands/${customId}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: customPath,
    }
  );
  req.imgPath = customPath;
  const brandObject = {
    name,
    slug,
    logo: { public_id, secure_url },
    subCategoryId,
    categoryId,
    customPath,
  };
  const brand = await brandModel.create(brandObject);
  if (!brand) {
    await cloudinary.uploader.destroy(public_id);
    await cloudinary.api.delete_folder(customPath);
    return next(new Error("You can't add this resource", { cause: 404 }));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

  return SuccessResponse(
    res,
    { message: "Brand created successfully", statusCode: 230, brand },
    201
  );
});

export const getAllBrands = asyncHandler(async (req, res, next) => {
  const brands = await brandModel.find().populate([
    { path: "categoryId", select: "name -_id" },
    { path: "subCategoryId", select: "name -_id" },
  ]);
  return brands
    ? SuccessResponse(
        res,
        {
          message: "Brands retrieved successfully",
          statusCode: 200,
          brands,
        },
        200
      )
    : next(new Error("Can't get All Brands", { cause: 400 }));
});

export const updateBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let { name, categoryId, subCategoryId } = req.body;
  const brand = await brandModel.findById(id);
  if (!brand) {
    return next(new Error("brand is not found", { cause: 400 }));
  }
  const subCategory = await subCategoryModel.findById(subCategoryId);
  if (!subCategory) {
    return next(new Error("subCategory is not found", { cause: 400 }));
  }
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("Category doesn't exist", { cause: 400 }));
  }
  if(categoryId){
      brand.categoryId = categoryId;
  }
  if(subCategoryId){
    brand.subCategoryId = subCategoryId;
  }
  if (name) {
    name = name.toLowerCase();
    if (name === brand.name) {
      return next(
        new Error("Please enter different name from the old one", {
          cause: 400,
        })
      );
    }
    const existingBrand = await brandModel.findOne({ name });
    if (existingBrand) {
      return next(new Error("Please enter new name", { cause: 400 }));
    }
    brand.name = name;
    brand.slug = slugify(name, "_");
  }
  if (req.file) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await cloudinary.uploader.destroy(brand.logo.public_id);
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: brand.customPath,
      }
    );
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
    brand.logo = { public_id, secure_url };
  }
  await brand.save();
  return SuccessResponse(
    res,
    {
      message: "brand updated successfully",
      statusCode: 200,
      brand,
    },
    200
  );
});

export const deleteBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const brand = await brandModel.findOneAndDelete({ _id: id });
  if (!brand) {
    return next(new Error("brand is not found", { cause: 400 }));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  await cloudinary.api.delete_resources_by_prefix(brand.customPath); //remove folder and sub folders content
  await cloudinary.api.delete_folder(brand.customPath); //remove the folder tree
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

  return SuccessResponse(
    res,
    { message: "Brand deleted successfully", statusCode: 200 },
    200
  );
});
