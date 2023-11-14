import mongoose, { Schema, Types, model } from "mongoose";
import { systemRoles } from "../../src/utils/constants.js";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, "userName is required"],
      minLength: 2,
      lowercase: true,
      trim: true,
      unique: true,
    },
    email: {
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    age: Number,
    gender: {
      type: String,
      default: "male",
      enum: ["male", "female", 'Not specified'],
    },
    confirmEmail: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type : String,
      default: systemRoles.USER,
      enum: [...Object.values(systemRoles)]
    },
    phone: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: 'Offline',
      enum: ['Online', 'Offline'],
    },
    address: [
      {
        type: String,
        required: true,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    profile_pic: {
      secure_url: String,
      public_url: String,
    },
    cover_pictures: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    provider:{
      type:String,
      enum:['system', 'GOOGLE']
    },
    forgetCode: String,
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.models["User"] || model("User", userSchema);

export default userModel;
