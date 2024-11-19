import mongoose, { Schema, model , Document } from "mongoose";
import { REGEX } from "@/constants/regex";
import { IUser , IUserMethods , UserModel ,  } from "@/contracts/user.contract";
import { compareSync, hashSync } from "bcrypt";
import { ENUMS } from "@/constants/enum";


const validateEmail = (email: string) => REGEX.EMAIL.test(email);


const schema = new Schema<IUser , UserModel , IUserMethods>({
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: {
      type: String,
      required: true,
      validate: {
        validator: validateEmail,
        message: "Invalid email format",
      },
    },
    password: { type: String , select: false},
    signUpThrough: { type: String, enum: ENUMS.SIGNUP_THROUGH, required: true, default: "Web" },
    profileImage: { type: String },
    EmailVerifiedOTP: { type: String },
    EmailVerifiedOTPExpiredAt: { type: Date },
    isEmailVerified: { type: Boolean, default:false},
    EmailVerifiedAt: { type: Date,  },
    userType: { type: Schema.Types.ObjectId, ref: 'UserCategory'}, // Reference to UserCategory
    additionalAccessRights: { type: [String], default: [] }, // Add specific rights
    restrictedAccessRights: { type: [String], default: [] }, // Remove specific rights
    phoneNumber: { type: String},
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Number, select: false },
}, { timestamps: true });

schema.methods.hashPassword = function (password: string) {
  return hashSync (password, 10);
}

schema.methods.comparePassword = function (password: string) {
  return compareSync(password, this.password);
};

export const User = model<IUser , UserModel>('User', schema);


