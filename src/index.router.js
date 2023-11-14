import connectDB from "../DB/connection.js";
import bodyParser from "body-parser";
import cors from "cors";

import authRouter from "./modules/auth/auth.router.js";
import categoryRouter from "./modules/category/category.router.js";
import subCategoryRouter from "./modules/subCategory/subCategory.router.js";
import brandRouter from "./modules/brands/brand.router.js";
import productRouter from "./modules/products/product.router.js";
import cartRouter from "./modules/carts/cart.router.js";
import couponRouter from "./modules/coupons/coupon.router.js";
import orderRouter from "./modules/orders/order.router.js";
import { globalErrorHandling } from "./utils/handlers.js";

const initApp = async (express) => {
  const app = express();
  const port = process.env.PORT || 5000;

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    if (req.originUrl == "/order/webhook") {
      next();
    } else {
      express.json({})(req, res, next);
    }
  });
  const whitelist = ["http://example1.com", "http://example2.com", undefined];
  // must change whitelist in production
  const corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
  // app.use(express.json());
  app.use(cors(corsOptions));
  await connectDB();
  const base = `/${process.env.PROJECT_FOLDER}`;
  app.use(`${base}/auth`, authRouter);
  app.use(`${base}/category`, categoryRouter);
  app.use(`${base}/sub-category`, subCategoryRouter);
  app.use(`${base}/brand`, brandRouter);
  app.use(`${base}/product`, productRouter);
  app.use(`${base}/cart`, cartRouter);
  app.use(`${base}/coupon`, couponRouter);
  app.use(`${base}/order`, orderRouter);

  app.use("*", (req, res, next) => {
    return res.json({ message: "In-valid Routing" });
  });
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`App listening on port ${port}!`));
};

export default initApp;
