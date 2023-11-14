import slugify from "slugify";
import cloudinary from "../../../utils/cloudinaryConfigurations.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import { generateRandomString } from "../../../utils/stringMethods.js";
import categoryModel from "../../../../DB/models/category.model.js";

// corner cases : check from file (if sent), check from createdBy if sent


export const addCategory = asyncHandler(async (req, res, next) => {
  let { name } = req.body;
  name = name.toLowerCase();
  const exisitngCategory = await categoryModel.findOne({ name });
  if (exisitngCategory) {
    return next(
      new Error("Please enter different category name", { cause: 400 })
    );
  }
  if (!req.file) {
    return next(new Error("Please upload a category image", { cause: 400 }));
  }
  const slug = slugify(name, "_");
  const customId = generateRandomString();

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const customPath = `${process.env.PROJECT_FOLDER}/Categories/${customId}`;
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: customPath,
    }
  );
  req.imgPath = customPath;

  const categoryObject = {
    name,
    slug,
    createdBy: req.user._id,
    image: {
      secure_url,
      public_id,
    },
    customId,
  };
  const category = await categoryModel.create(categoryObject);
  if (!category) {
    await cloudinary.uploader.destroy(public_id);
    await cloudinary.api.delete_folder(customPath);
    return next(new Error("You can't add this resource", { cause: 404 }));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  return SuccessResponse(
    res,
    { message: "Category created successfully", statusCode: 230, category },
    201
  );
});

export const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel
    .find()
    .populate([{ path: "subCategories", select: "name -categoryId -_id"}, { path: "brands", select: "name"  }, { path: "products", select: "name"  }]);
    /*
    // .populate([{ path: "subCategories", select: "name -categoryId -_id", populate : { path: "brands", select: "name" } }]);
      This way to retrieve data in this format 
      "subCategories": [
                {
                    "name": "electronics",
                    "brands": [
                        {
                            "_id": "6504638ec8938bd4f0ab0875",
                            "name": "telecom",
                            "subCategoryId": "650442777ffcf2b8230a71bd"
                        }
                    ],
                    "id": null
                },
                {
                    "name": "home appliances",
                    "brands": [
                        {
                            "_id": "650463d4c8938bd4f0ab0882",
                            "name": "2bupdated",
                            "subCategoryId": "65046679c8938bd4f0ab0890"
                        }
                    ],
                    "id": null
                }
            ],
    */
  return categories
    ? SuccessResponse(
        res,
        {
          message: "Categories retrieved successfully",
          statusCode: 200,
          categories,
        },
        200
      )
    : next(new Error("Can't get All Categories", { cause: 400 }));
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  // if name is already existing
  // if id is in wrong format or not existing
  // update name, slug, photo
  const { id } = req.params;
  let { name } = req.body;
  const category = await categoryModel.findById(id);

  if (!category) {
    return next(new Error("Category is not found", { cause: 400 }));
  }
  if (name) {
    name = name.toLowerCase();
    if (name === category.name) {
      return next(
        new Error("Please enter new name from the old one", { cause: 400 })
      );
    }
    const existingCat = await categoryModel.findOne({ name });
    if (existingCat) {
      return next(new Error("Please enter new name", { cause: 400 }));
    }
    category.name = name;
    category.slug = slugify(name, "_");
  }
  if (req.file) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await cloudinary.uploader.destroy(category?.image?.public_id);
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}`,
      }
    );
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
    category.image = { public_id, secure_url };
  }
  await category.save();
  return SuccessResponse(
    res,
    { message: "Category updated successfully", statusCode: 200, category },
    200
  );
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const category = await categoryModel.findOneAndDelete({ _id: id });
  if (!category) {
    return next(new Error("Category is not found", { cause: 400 }));
  }
  // db handled from hook side
  // const deleteRelatedSubCategories = await subCategoryModel.deleteMany({
  //   categoryId: id,
  // });
  // if (!deleteRelatedSubCategories.deletedCount) {
  //   return next(new Error("Can't delete sub Category", { cause: 400 }));
  // }

  // delete cloud
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${category?.customId}`
  ); //remove folder and sub folders content
  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${category?.customId}`
  ); //remove the folder tree
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

  return SuccessResponse(
    res,
    { message: "Category deleted successfully", statusCode: 200, category },
    200
  );
});
