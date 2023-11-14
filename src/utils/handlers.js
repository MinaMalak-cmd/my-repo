import cloudinary from "./cloudinaryConfigurations.js";

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(async (error) => {
          console.log("🚀 ~ file: handlers.js:6 ~ return ~ error:", error)
          //============================= cloud ======================
          if(req.method !== "GET" && req.imgPath){
            await cloudinary.api.delete_resources_by_prefix(req.imgPath);
            await cloudinary.api.delete_folder(req.imgPath);
          }
          //============================= db ==================
          if(req.failedDocument){
            const { model, _id } = req.failedDocument;
            await model.findByIdAndDelete(_id);
          }
         
          return next(new Error(error))
        })
    }
}

export const globalErrorHandling = (error, req, res, next) => {
    error.statusCode = error.statusCode || error?.cause || 400;
    if(req.validationErrors){
      error.validationErrors = [...req.validationErrors];
      error.message = "Validation error"
    }
    if(process.env.NODE_ENV !== 'production'){
        sendErrorDev(error, res);
    }
    else{
        sendErrorProd(error, res);  
    }
}

const sendErrorDev = (error, res) => {
  if(error.validationErrors){
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      stack: error.stack,
      errors : error.validationErrors
    });
  }
  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message: error.message,
    stack: error.stack,
  });

}

const sendErrorProd = (error, res) =>{
  if(error.validationErrors){
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      errors: error.validationErrors
    });
  }
  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message: error.message,
  });
}

export const SuccessResponse = (res, data, statusCode) => {
    return res.status(statusCode).json(data)
}