import Stripe from "stripe";
import productModel from "../../../../DB/models/product.model.js";
import orderModel from "../../../../DB/models/order.model.js";
import { SuccessResponse, asyncHandler } from "../../../utils/handlers.js";
import { generateRandomString } from "../../../utils/stringMethods.js";
import createInvoice from "../../../utils/pdfkit.js";
import sendEmail from "../../../services/emailService.js";
import { paymentMethods, orderStatus } from "../../../utils/constants.js";
import { paymentFunction } from "../../../utils/payment.js";
import { generateToken, verifyToken } from "../../../utils/tokenFunctions.js";

export const addOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { products, address, phoneNumbers, paymentMethod } = req.body;
  const coupon = req?.coupon;
  let sentProducts = [];
  let subTotal = 0;
  for (let i = 0; i < products?.length; i++) {
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
      let finalPrice = products[i].quantity * productCheck.priceAfterDiscount;
      sentProducts.push({
        productId: productCheck._id,
        quantity: products[i].quantity,
        title: productCheck.title,
        price: productCheck.priceAfterDiscount,
        finalPrice,
      });
      subTotal += finalPrice;
      continue;
    }
  }

  if (coupon?.isFixedAmount && subTotal < coupon?.couponAmount) {
    return next(new Error("Invalid coupon amount", { cause: 400 }));
  }
  let paidAmount;
  if (coupon?.isFixedAmount) {
    paidAmount = subTotal - coupon?.isFixedAmount;
  } else if (coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100);
  } else {
    paidAmount = subTotal;
  }
  let orderStatus = paymentMethod == "cash" ? "placed" : "pending";

  const orderObject = {
    userId,
    products: sentProducts,
    subTotal,
    couponId: coupon?._id || null,
    paidAmount,
    address,
    phoneNumbers,
    paymentMethod,
    orderStatus,
  };

  const orderDb = await orderModel.create(orderObject);
  if (!orderDb) {
    return next(new Error("Order fail"));
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  let payment;
  if (orderDb.paymentMethod === paymentMethods.CARD) {
    let stripeCoupon;
    if (orderDb.couponId) {
      const stripeConnection = new Stripe(process.env.STRIPE_KEY);
      if (req.coupon.isPercentage) {
        stripeCoupon = await stripeConnection.coupons.create({
          percent_off: req.coupon.couponAmount,
        });
      } else if (req.coupon.isFixedAmount) {
        stripeCoupon = await stripeConnection.coupons.create({
          amount_off: req.coupon.couponAmount * 100,
          currency: "EGP",
        });
      }
    }
    const line_items = orderDb.products.map((product) => {
      return {
        price_data: {
          currency: "EGP",
          product_data: {
            name: product.title,
          },
          unit_amount: product.price * 100,
        },
        quantity: product.quantity,
      };
    });
    const token = generateToken({
      payload: { orderId: orderDb._id },
      signature: process.env.STRIPE_SIGNATURE,
    });
    payment = await paymentFunction({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      success_url: `http://localhost:5000/${process.env.PROJECT_FOLDER}/order/successPayment/${token}`,
      cancel_url: `http://localhost:5000/${process.env.PROJECT_FOLDER}/order/cancelPayment/${token}`,
      metadata: { orderId: orderDb._id.toString() },
      discounts: stripeCoupon ? [{ coupon: stripeCoupon.id }] : [],
      line_items,
    });
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

  //======================= invoice ==================
  const orderCode = `${req.user.userName}__${generateRandomString(3)}`;
  const invoiceData = {
    orderCode,
    date: orderDb.createdAt,
    shipping: {
      name: req.user.userName,
      address,
      city: "Giza",
      state: "Giza",
      country: "Egypt",
    },
    items: orderDb.products,
    subTotal: orderDb.subTotal,
    paidAmount: orderDb.paidAmount,
  };
  await createInvoice(invoiceData, `${orderCode}.pdf`);
  const emailSent = await sendEmail({
    to: req.user.email,
    subject: "Order",
    text: `<h1> Please find your invoice below </h1>`,
    attachments: [
      {
        path: `./Files/${orderCode}.pdf`,
      },
    ],
  });
  if (!emailSent) {
    return next(new Error("Fail to sent confirmation email", { cause: 400 }));
  }

  for (let i = 0; i < sentProducts.length; i++) {
    const productCheck = await productModel
      .findOne({
        _id: sentProducts[i].productId,
      })
      .select("priceAfterDiscount title stock");
    if (productCheck) {
      productCheck.stock -= sentProducts[i].quantity;
    }
    await productCheck.save();
  }
  if (req.coupon) {
    for (const user of req.coupon.couponAssignedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount += 1;
      }
    }
    await req.coupon.save();
  }
  return SuccessResponse(
    res,
    {
      message: "Order created successfully",
      statusCode: 230,
      orderDb,
      payment,
    },
    201
  );
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await orderModel.find().populate({
    path: 'couponId',
    select: 'couponAmount couponAssignedToUsers'
  });

  return orders
    ? SuccessResponse(
        res,
        {
          message: "Orders retrieved successfully",
          statusCode: 200,
          orders,
        },
        200
      )
    : next(new Error("Can't get All orders", { cause: 400 }));
});

export const formCartToOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { cartId, address, phoneNumbers, paymentMethod } = req.body;
  const cart = await cartModel.findOne({ _id: cartId, userId });
  if (!cart || !cart.products.length) {
    return next(new Error("Invalid cart", { cause: 400 }));
  }
  const coupon = req?.coupon;
  for (let product of cart.products) {
    const productCheck = await productModel
      .findById(product._id)
      .select("priceAfterDiscount title");
    if (!productCheck) {
      return next(
        new Error(
          "Either product isn't existing or doesn't have enough quantity",
          { cause: 400 }
        )
      );
    } else {
      let finalPrice = product.quantity * productCheck.priceAfterDiscount;
      sentProducts.push({
        productId: productCheck._id,
        quantity: product.quantity,
        title: productCheck.title,
        price: productCheck.priceAfterDiscount,
        finalPrice,
      });
      continue;
    }
  }
  let subTotal = cart.subTotal;
  if (coupon?.isFixedAmount && subTotal < coupon?.couponAmount) {
    return next(new Error("Invalid coupon amount", { cause: 400 }));
  }
  let paidAmount;
  if (coupon?.isFixedAmount) {
    paidAmount = subTotal - coupon?.isFixedAmount;
  } else if (coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100);
  } else {
    paidAmount = subTotal;
  }
  let orderStatus = paymentMethod == "cash" ? "placed" : "pending";
  const orderObject = {
    userId,
    products: sentProducts,
    subTotal,
    couponId: coupon?._id || null,
    paidAmount,
    address,
    phoneNumbers,
    paymentMethod,
    orderStatus,
  };
  const orderDb = await orderModel.create(orderObject);
  if (!orderDb) {
    return next(new Error("Order fail"));
  }
  if (coupon) {
    for (const user of coupon.couponAssginedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount += 1;
      }
    }
    await coupon.save();
  }
  cart.products = [];
  cart.subTotal = 0;
  await cart.save();
  return SuccessResponse(
    res,
    { message: "Order created successfully", statusCode: 230, orderDb },
    201
  );
});

//============================= you can use webhooks as alternative ========================
// export const successPayment = asyncHandler(async (req, res, next) => {
//     const stripe = new Stripe(process.env.STRIPE_KEY);
//     const sig = req.headers['stripe-signature'];
//     let event;
//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
//     } catch (err) {
//       return res.status(400).send(`Webhook Error: ${err.message}`);;
//     }

//     // Handle the event
//     const {orderId } = event.data.object.metadata;
//     switch (event.type) {
//       // case 'checkout.session.async_payment_failed':
//       //   const checkoutSessionAsyncPaymentFailed = event.data.object;
//       //   break;
//       // case 'checkout.session.async_payment_succeeded':
//       //   const checkoutSessionAsyncPaymentSucceeded = event.data.object;
//       //   break;
//       case 'checkout.session.completed':
//         await orderModel.findOneAndUpdate({ _id: orderId}, { orderStatus : orderStatus.CONFIRMED})
//         return  SuccessResponse(
//           res,
//           { message: "Payment Done", statusCode: 230 },
//           200
//         );
//       default:
//         await orderModel.findOneAndUpdate({ _id: orderId}, { orderStatus : orderStatus.CANCELLED})
//         return next(
//           new Error(
//             "Please try again later",
//             { cause: 500 }
//           )
//         );
//     }

// });

export const successPayment = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decodedData = verifyToken({
    token,
    signature: process.env.STRIPE_SIGNATURE,
  });
  if (!decodedData.orderId) {
    return next(new Error("invalid token", { cause: 400 }));
  }
  const order = await orderModel.findOneAndUpdate(
    { _id: decodedData.orderId, orderStatus: orderStatus.PENDING },
    { orderStatus: orderStatus.CONFIRMED },
    { new: true }
  );
  if (!order) {
    return next(new Error("invalid order", { cause: 400 }));
  }
  return SuccessResponse(
    res,
    { message: "Payment Done", statusCode: 230, order },
    200
  );
});

export const cancelPayment = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decodedData = verifyToken({
    token,
    signature: process.env.STRIPE_SIGNATURE,
  });
  if (!decodedData.orderId) {
    return next(new Error("invalid token", { cause: 400 }));
  }
  const order = await orderModel.findOneAndUpdate(
    { _id: decodedData.orderId, orderStatus: orderStatus.PENDING },
    { orderStatus: orderStatus.CANCELLED },
    { new: true }
  ).populate({
    path: 'couponId',
    select: 'couponAmount couponAssignedToUsers'
  });
  if (!order) {
    return next(new Error("invalid order", { cause: 400 }));
  }
  let coupon = order?.couponId;
  if (coupon) {
    for (const user of coupon.couponAssignedToUsers) {
      if (user.userId.toString() == order.userId.toString()) {
        user.usageCount -= 1;
      }
    }
    await coupon.save();
  }
 for(let product of order.products){
  await productModel.findByIdAndUpdate(product.productId, {
    $inc: { stock : parseInt(product.quantity)}
  })
 }

  return SuccessResponse(
    res,
    { message: "Payment Cancelled", statusCode: 500, order },
    500
  );
});
