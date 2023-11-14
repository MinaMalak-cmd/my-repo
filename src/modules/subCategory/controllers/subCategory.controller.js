import slugify from "slugify";
import cloudinary from "../../../utils/cloudinaryConfigurations.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import { generateRandomString } from "../../../utils/stringMethods.js";
import categoryModel from "../../../../DB/models/category.model.js";
import subCategoryModel from "../../../../DB/models/subcategory.model.js";

export const addSubCategory = asyncHandler(async (req, res, next) => {
  // add created by
  let { name, createdBy, categoryId } = req.body;
  name = name.toLowerCase();
  if (!req.file) {
    return next(new Error("Please upload a category image", { cause: 400 }));
  }
  const isNameDuplicate = await subCategoryModel.findOne({ name });
  if (isNameDuplicate) {
    return next(
      new Error("Please enter different category name", { cause: 400 })
    );
  }
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("Category doesn't exist", { cause: 400 }));
  }
  const slug = slugify(name, "_");
  const customId = generateRandomString();
  const customPath = `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${customId}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: customPath,
    }
  );
  req.imgPath = customPath;
  const subCategoryObject = {
    name, slug, image : { public_id, secure_url }, categoryId, customPath 
  }
  const subCategory = await subCategoryModel.create(subCategoryObject);
  if(!subCategory){
    await cloudinary.uploader.destroy(public_id);
    await cloudinary.api.delete_folder(customPath);
    return next(new Error("You can't add this resource", { cause: 404 }));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1"; 

  return SuccessResponse(
    res,
    { message: "Sub Category created successfully", statusCode: 230, subCategory },
    201
  );
});

export const getAllSubCategories = asyncHandler(async (req, res, next) => {
  const subCategories = await subCategoryModel.find()
    .populate([
      { path: 'categoryId', select: 'name -_id' },
      {
        path: 'brands',
        select: 'name',
      },
  ]);
  return subCategories
    ? SuccessResponse(
        res,
        {
          message: "Sub Categories retrieved successfully",
          statusCode: 200,
          subCategories,
        },
        200
      )
    : next(new Error("Can't get All Sub Categories", { cause: 400 }));
});

export const updateSubCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let { name, categoryId } = req.body;
    const subCategory = await subCategoryModel.findById(id);
    if(!subCategory){
      return next(new Error('subCategory is not found', { cause: 400 }))
    }
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return next(new Error("Category doesn't exist", { cause: 400 }));
    }
    subCategory.categoryId = categoryId;
    if(name){
      name = name.toLowerCase();
      if(name === subCategory.name){
        return next(new Error('Please enter different name from the old one', { cause: 400 }))
      }
      const existingCat = await subCategoryModel.findOne({name});
      if(existingCat){
        return next(new Error('Please enter new name', { cause: 400 }))
      }
      subCategory.name = name;
      subCategory.slug = slugify(name, "_");
    }
    if(req.file){
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      await cloudinary.uploader.destroy(subCategory?.image?.public_id);
      const { public_id, secure_url } = await cloudinary.uploader.upload(
        req.file.path, {
          folder: subCategory?.customPath,
        });
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
      subCategory.image = { public_id, secure_url };
    }
    await subCategory.save();
    return SuccessResponse(res, { message: "subCategory updated successfully", statusCode: 200, subCategory }, 200)
});

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await subCategoryModel.findOneAndDelete({ _id : id });
  if(!subCategory){
    return next(new Error('subCategory is not found', { cause: 400 }))
  }
  if(subCategory?.image?.public_id){
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await cloudinary.api.delete_resources_by_prefix(subCategory.customPath); //remove folder and sub folders content
    await cloudinary.api.delete_folder(subCategory.customPath); //remove the folder tree
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }
  return SuccessResponse(res, { message: "subCategory deleted successfully", statusCode: 200 }, 200)
});
