import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import userModel from "../../../../DB/models/user.model.js";
import { asyncHandler, SuccessResponse } from "../../../utils/handlers.js";
import sendEmail from "../../../services/emailService.js";
import { generateRandomString } from "../../../utils/stringMethods.js";

export const signup = asyncHandler(async (req, res, next) => {
  const protocol = req.protocol;
  const host = req.headers.host;
  const {
    userName,
    email,
    password,
    cPassword,
    age,
    gender,
    phone,
    address,
    role,
  } = req.body;

  if (password != cPassword) {
    return next(new Error("Password Mismatch cPassword", { cause: 400 }));
  }

  const checkMail = await userModel.findOne({ email });
  if (checkMail) return next(new Error("Email must be unique"));
  const checkPhone = await userModel.findOne({ phone });
  if (checkPhone) return next(new Error("Phone must be unique"));
  const checkUserName = await userModel.findOne({ userName });
  if (checkUserName) return next(new Error("User Name must be unique"));

  const hashPassowrd = bcrypt.hashSync(
    password,
    parseInt(process.env.SALT_ROUND)
  );
  const user = await userModel.create({
    userName,
    email,
    password: hashPassowrd,
    age,
    gender,
    phone,
    address,
    role,
  });

  const token = jwt.sign(
    { email: user.email, id: user._id },
    process.env.EMAIL_SIGNATURE,
    { expiresIn: 60 * 5 }
  );
  const link = `${protocol}://${host}/${process.env.PROJECT_FOLDER}/auth/confirm-email/${token}`;

  const refreshEmailToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.EMAIL_SIGNATURE,
    { expiresIn: 60 * 60 * 60 * 24 * 30 }
  );
  const refreshEmailLink = `${protocol}://${host}/${process.env.PROJECT_FOLDER}/auth/new-confirm-email/${refreshEmailToken}`;
  const unSubscribeLink = `${protocol}://${host}/${process.env.PROJECT_FOLDER}/auth/unsubscribe/${refreshEmailToken}`;
  const html = `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
    <style type="text/css">
    body{background-color: #88BDBF;margin: 0px;}
    </style>
    <body style="margin:0px;"> 
    <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
    <td>
    <table border="0" width="100%">
    <tr>
    <td>
    <h1>
        <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
    </h1>
    </td>
    <td>
    <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
    <tr>
    <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
    <img width="50px" height="50px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png">
    </td>
    </tr>
    <tr>
    <td>
    <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
    </td>
    </tr>
    <br>
    <br>
    <tr>
    <td>
    <a href="${refreshEmailLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">New Verify Email address</a>
    </td>
    </tr>
    <br>
    <br>
    <tr>
    <td>
    <a href="${unSubscribeLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Unsubscribe</a>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
    <tr>
    <td>
    <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
    </td>
    </tr>
    <tr>
    <td>
    <div style="margin-top:20px;">
  
    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>
  
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;
  await sendEmail({ to: user.email, subject: "Confirm User Email", html });
  return SuccessResponse(res, { message: "Done", user }, 201);
});

export const login = asyncHandler(async (req, res, next) => {
  const { userName, password, email, phone } = req.body;
  const user = await userModel.findOne({
    $or: [{ email }, { userName }, { phone }],
  });
  if (!user) {
    return next(new Error("User not exist", { cause: 404 }));
  }
  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return next(new Error("In-valid login data", { cause: 400 }));
  }
  const token = jwt.sign({ id: user._id }, process.env.TOKEN_SIGNATURE, {
    expiresIn: "30m",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.TOKEN_SIGNATURE, {
    expiresIn: "30d",
  });
  return SuccessResponse(
    res,
    {
      message: `Hi ${user.userName}`,
      accessToken: token,
      refreshToken: refreshToken,
    },
    200
  );
});

// change password should be done through email
export const changePassword = asyncHandler(async (req, res, next) => {
  const { password, email } = req.body;
  if (!password) {
    return next(new Error("Missing param", { cause: 400 }));
  }
  const hashPassword = bcrypt.hashSync(
    password,
    parseInt(process.env.SALT_ROUND)
  );

  const user = await userModel.updateOne(
    { email: email },
    {
      password: hashPassword,
    },
    {
      new: true,
    }
  );
  return user.matchedCount
    ? SuccessResponse(res, { message: "your password has been updated" }, 200)
    : next(new Error("In valid Email", { cause: 404 }));
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.EMAIL_SIGNATURE);
  const user = await userModel.findByIdAndUpdate(
    decoded?.id,
    { confirmEmail: true },
    { new: true }
  );
  return user
    ? res.redirect("http://localhost:4200/#/login")
    : res.send(
        `<a href="http://localhost:4200/#/signUp">Ops u look like don't have account yet to join us follow me now.</a>`
      );
});

export const newConfirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.EMAIL_SIGNATURE);

  const user = await userModel.findById(decoded?.id);
  if (!user) {
    return res.send(
      `<a href="http://localhost:4200/#/signUp">Ops u look like don't have account yet to join us follow me now.</a>`
    );
  }
  if (user.confirmEmail) {
    return res.redirect("http://localhost:4200/#/login");
  }
  const newtToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.EMAIL_SIGNATURE,
    { expiresIn: 60 * 5 }
  );
  const link = `${req.protocol}://${req.headers.host}/${process.env.PROJECT_FOLDER}/auth/confirm-email/${newtToken}`;

  const html = `<!DOCTYPE html>
      <html>
      <head>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
      <style type="text/css">
      body{background-color: #88BDBF;margin: 0px;}
      </style>
      <body style="margin:0px;"> 
      <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
      <tr>
      <td>
      <table border="0" width="100%">
      <tr>
      <td>
      <h1>
          <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
      </h1>
      </td>
      <td>
      <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      <tr>
      <td>
      <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
      <tr>
      <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
      <img width="50px" height="50px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png">
      </td>
      </tr>
      <tr>
      <td>
      <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
      </td>
      </tr>
      <tr>
      <td>
      <p style="padding:0px 100px;">
      </p>
      </td>
      </tr>
      <tr>
      <td>
      <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      <tr>
      <td>
      <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
      <tr>
      <td>
      <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
      </td>
      </tr>
      <tr>
      <td>
      <div style="margin-top:20px;">
  
      <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
      <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
      
      <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
      <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
      </a>
      
      <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
      <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
      </a>
  
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </table>
      </body>
      </html>`;

  await sendEmail({ to: user.email, subject: "Confirm User Email", html });
  return res.send(`<p>Check your inbox now.</p>`);
});

export const unSubscribe = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.EMAIL_SIGNATURE);

  const user = await userModel.findById(decoded.id);
  if (!user) {
    return res.send(
      `<a href="http://localhost:4200/#/signUp">Ops u look like don't have account yet to join us follow me now.</a>`
    );
  }
  if (user.confirmEmail) {
    return next(new Error("you can't unsubscribe active user"), { cause: 400 });
  }
  const deletedUser = await userModel.findByIdAndDelete(decoded?.id);

  return deletedUser
    ? SuccessResponse(
        res,
        { message: "Un subscribe has been done correctly" },
        200
      )
    : next(new Error("In valid user id", { cause: 404 }));
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new Error("Please enter required fields", { cause: 404 }));
  const user = await userModel.findOne({ email });
  if (!user) return next(new Error("Please enter valid Email", { cause: 404 }));
  const token = jwt.sign({ email, id: user._id }, process.env.EMAIL_SIGNATURE, {
    expiresIn: 60 * 5,
  });
  const link = `http://localhost:4200/#/changePassword/${token}`;

  const html = `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
    <style type="text/css">
    body{background-color: #88BDBF;margin: 0px;}
    </style>
    <body style="margin:0px;"> 
    <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
    <td>
    <table border="0" width="100%">
    <tr>
    <td>
    <h1>
        <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
    </h1>
    </td>
    <td>
    <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
    <tr>
    <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
    <img width="50px" height="50px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png">
    </td>
    </tr>
    <tr>
    <td>
    <h1 style="padding-top:25px; color:#630E2B">Change Password</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Change Password</a>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
    <tr>
    <td>
    <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
    </td>
    </tr>
    <tr>
    <td>
    <div style="margin-top:20px;">
  
    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>
  
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;
  await sendEmail({ to: email, subject: "Change password", html });
  return res.send(`<p>Check your inbox</p>`);
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await userModel.find();

  return users
    ? SuccessResponse(
        res,
        {
          message: "users retrieved successfully",
          statusCode: 200,
          users,
        },
        200
      )
    : next(new Error("Can't get All users", { cause: 400 }));
});

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const client = new OAuth2Client();
  const { idToken } = req.body;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

  const { email_verified, email, name } = await verify();
  if (!email_verified || !email) {
    return next(new Error("Email not verified", { cause: 400 }));
  }
  const user = await userModel.findOne({ email, provider: "GOOGLE" });
  if (user) {
    const token = generateToken({
      payload: { _id: user._id, email: user.email, role: user.role },
      signature: process.env.TOKEN_SIGNATURE,
      expiresIn: "1h",
    });
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      {
        token,
        status: "Online",
      },
      {
        new: true,
      }
    );
    return SuccessResponse(
      res,
      {
        message: "User found",
        statusCode: 200,
        updatedUser,
        token,
      },
      200
    );
  }
  // signUp
  const newUser = await userModel.create({
    userName: name,
    email,
    provider: "GOOGLE",
    isConfirmed: true,
    password: generateRandomString(5),
    phoneNumber: "0000000",
    address: ["giza"],
  });

  const token = generateToken({
    payload: { _id: newUser._id, email: newUser.email, role: newUser.role },
    signature: process.env.TOKEN_SIGNATURE,
    expiresIn: "1h",
  });
  return SuccessResponse(
    res,
    {
      message: "User Created",
      statusCode: 201,
      newUser,
      token,
    },
    200
  );
});
