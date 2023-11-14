import productModel from "../../../../DB/models/product.model.js";
import cartModel from "../../../../DB/models/cart.model.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";

export const addToCart = asyncHandler(async (req, res, next) => {
  let userId = req.user._id;
  let { products } = req.body;
  let subTotal = 0;
  for (let i = 0; i < products.length; i++) {
    const productCheck = await productModel
      .findOne({
        _id: products[i].productId,
        stock: { $gte: products[i].quantity },
      })
      .select("priceAfterDiscount title");
    if (!productCheck)
      return next(
        new Error(
          "Either product isn't existing or doesn't have enough quantity",
          { cause: 400 }
        )
      );
    else {
      subTotal += productCheck.priceAfterDiscount * products[i].quantity;
      continue;
    }
  }
  //=================== Validate if cart exists =======================

  // const cart = await cartModel.find({ userId });
  // if (!cart) {
    const newCart = await cartModel.create({
      userId,
      products,
      subTotal,
    });
    // handle by hook, setTimeout
    // productCheck.stock = quantity
    // await productCheck.save
    return SuccessResponse(
      res,
      { message: "Cart created successfully", statusCode: 230, newCart },
      201
    );
  // }
  // else{
  //   for(let i = 0; i < products.length; i++) {
  //     const id = products[i].productId;
  //     const isExistingProduct = cart.products.find(el => el.productId === id);
  //     if(isExistingProduct){
  //       const productCheck = await productModel
  //       .findOne({
  //         _id: products[i].productId,
  //         stock: { $gte: products[i].quantity },
  //       })
  //       subTotal -= isExistingProduct.
  //       cart.products.splice(i, 1);
  //       cart.products.push(products[i]);
  //     }
  //     cart.products.push(products[i]);
  //   }
  // }
  //=================== if cart exists =======================
  // update product quantity, color, any other specs -> Done
  // check if update or not to push or to modify existing product -> Done
  // modify subTotal
  // priceAfterDiscount of each product
  // after modify suerCart -> save it
});

export const getAllCarts = asyncHandler(async (req, res, next) => {
  const carts = await cartModel
    .find()
    .populate([{ path: "userId", select: "userName " }]);

  return carts
    ? SuccessResponse(
        res,
        {
          message: "carts retrieved successfully",
          statusCode: 200,
          carts,
        },
        200
      )
    : next(new Error("Can't get All carts", { cause: 400 }));
});


export const deleteFromCart = asyncHandler(async (req, res, next) => {
  let userId = req.user._id;
  const { productId } = req.params;

  const product = await productModel.findById(productId);
  if(!product){
    return next(new Error("Can't get Product", { cause: 400 }));
  }
  const cart = await cartModel.findOne({
    userId: userId,
    'products.productId': productId
  })
  // 'products.productId' : {$in : [productIds]}
  if(!cart){
    return next(new Error("Can't get Product", { cause: 400 }))
  }
  cart.products = cart.products.filter(n => {
    if(n.productId == productId){
      cart.subTotal -= product.priceAfterDiscount * n.quantity;
    }
    return n.productId != productId
  });
  await cart.save();
  SuccessResponse(
    res,
    {
      message: "Done",
      statusCode: 200,
      cart,
    },
    200
  )
})

export const deleteAllCartsForThisUser = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const carts = await cartModel.deleteMany({userId});
  return carts.deletedCount ? SuccessResponse(
    res,
    {
      message: "carts deleted successfully",
      statusCode: 200,
      carts,
    },
    200
  ) : next(new Error("No carts assigned to this user", { cause: 400 }));
  
});