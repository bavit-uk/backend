import mongoose, { Schema, model , Document } from "mongoose";
import { REGEX } from "@/constants/regex";
import { IUser , IUserCategory , IUserMethods , UserModel } from "@/contracts/user.contract";


const validateEmail = (email: string) => REGEX.EMAIL.test(email);

const userCategorySchema = new Schema<IUserCategory>({
    userType: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: { type: [String], required: true }, 
}, { timestamps: true });

export const UserCategory = model<IUserCategory>('UserCategory', userCategorySchema);



const UserSchema = new Schema<IUser , UserModel , IUserMethods>({
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
    password: { type: String },
    signUpThrough: { type: String, enum: ["Google", "Apple", "Web"], required: true, default: "Web" },
    profileImage: { type: String },
    EmailVerifiedOTP: { type: String },
    EmailVerifiedOTPExpiredAt: { type: Date },
    isEmailVerified: { type: Boolean, },
    EmailVerifiedAt: { type: Date,  },
    userType: { type: Schema.Types.ObjectId, ref: 'UserCategory', required: true }, // Reference to UserCategory
    additionalAccessRights: { type: [String], default: [] }, // Add specific rights
    restrictedAccessRights: { type: [String], default: [] }, // Remove specific rights
    phoneNumber: { type: String, required: true },
}, { timestamps: true });


export const User = model<IUser , UserModel>('User', UserSchema);


