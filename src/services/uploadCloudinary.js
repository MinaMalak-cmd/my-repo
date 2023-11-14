import multer from "multer";
import { allowedExtensions } from "../utils/allowedExtensions.js";

export const uploadCloudinary = (
  allowedExtensionsArr = allowedExtensions.Image
) => {
  const storage = multer.diskStorage({});
  const fileFilter = (req, file, cb) => {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Invalid extension", { cause: 400 }), false);
  };

  const fileUpload = multer({
    fileFilter,
    storage,
  });
  return fileUpload;
};
