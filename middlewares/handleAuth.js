import jwt from "jsonwebtoken";
import userModel from "../DB/models/user.model.js";
import { asyncHandler } from "../src/utils/handlers.js";

const handleAuth = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization?.startsWith(process.env.BEARER_KEY)) {
    return next(
      new Error("authorization is required or In-valid Bearer key", {
        cause: 400,
      })
    );
  }
  const token = authorization.split(process.env.BEARER_KEY)[1];
  if (!token) {
    return next(new Error("token is required", { cause: 400 }));
  }
  const decoded = jwt.verify(token, process.env.TOKEN_SIGNATURE);
  if (!decoded?.id) {
    return next(new Error("In-valid  token payload", { cause: 400 }));
  }
  const user = await userModel
    .findById(decoded.id)
    .select("userName email role confirmEmail");
  if (!user) {
    return next(new Error("Not register account", { cause: 401 }));
  }
  if (!user.confirmEmail) {
    return next(new Error("Not activated account", { cause: 401 }));
  }
  req.user = user;
  return next();
});

export default handleAuth;
