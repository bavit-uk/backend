import { Document, Model, Types } from "mongoose";


export interface IUserCategory extends Document {
    _id: Types.ObjectId;
    role: string;
    description?: string;
    permissions: string[];
    // isSupplier: boolean;
}


export type UserCategoryUpdatePayload = Partial<Pick<IUserCategory , "role" | "description" | "permissions">>



// export type UserRegisterPayload = Pick<IUser ,  "firstName" | "lastName" | "email" | "password" | "signUpThrough">
// export type UserLoginPayload = Pick<IUser ,  "email" | "password" >
// export type UserUpdateProfilePayload = Partial<Pick<IUser ,  "firstName" | "lastName" | "phoneNumber" | "profileImage"> & {
//     oldPassword: string,
//     newPassword: string
// } & {address: IUserAddress}>


export type UserCategoryModel = Model<IUserCategory>;
