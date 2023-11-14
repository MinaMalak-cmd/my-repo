import Stripe from 'stripe';

export const paymentFunction = async ({
    payment_method_types=['card'], 
    mode= 'payment',
    customer_email,
    success_url, 
    cancel_url,
    discounts,
    metadata, // if you use hook
    line_items,
}) => {
  const stripeConnection = new Stripe(process.env.STRIPE_KEY,
    {
      maxNetworkRetries: 5
    } 
    );
  // {
  //   maxNetworkRetries: 2,
  //   // httpAgent: new ProxyAgent(process.env.http_proxy),
  //   // timeout: 3000,
  //   // host: 'api.example.com',
  //   port: 123,
  //   telemetry: true,
  // }
  const payment = await stripeConnection.checkout.sessions.create({
    payment_method_types, // required
    mode, // required
    customer_email,
    // metadata, // if you use hook
    success_url, //  these two links must be for frontend pages, 
    // once frontend is rendered call certain apis in backend 
    cancel_url,
    discounts,
    line_items,
  });
  return payment;
};


// // line_items:[{
// //   price_data:{
// //       currency,
// //       product_data: {
// //           name,
// //       },
// //       unit_amount // price for the single item of product
// //   },
// //   quantity
// // }]

