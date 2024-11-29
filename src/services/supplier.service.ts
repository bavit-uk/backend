import { supplierAddPayload } from "@/contracts/supplier.contract";
import { IUserAddress } from "@/contracts/user-address.contracts";
import { IFile } from "@/contracts/user.contract";
import { User } from "@/models";
import { Address } from "@/models";
import { createHash } from "@/utils/hash.util";
import mongoose from "mongoose";

export const supplierService = {
  findExistingEmail: async (email: string) => {
    const userExists = await User.findOne({ email });
    return userExists;
  },

  createSupplier: async (data: supplierAddPayload) => {
    // console.log("data in service : " , data)
    const { firstName, lastName, email, password, phoneNumber, userType , supplierCategory, documents } = data;

    // Here this id refers to the supplier in user category
    // TODO: find other solutiuon for this
    const hashedPassword = await createHash(password);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      supplierCategory,
      userType,
      documents,
    });

    return user.save();
  },

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  getAllSuppliers: () => {
    return User.aggregate([
      {
        // Join with the 'usercategories' collection to get the user type details
        $lookup: {
          from: "usercategories",
          localField: "userType",
          foreignField: "_id",
          as: "userType",
        },
      },
      {
        // Flatten the 'userType' array into an object
        $unwind: "$userType",
      },
      {
        // Match only users where the userType role is "Supplier"
        $match: {
          "userType.role": "Supplier",
        },
      },
      {
        // Join with the 'addresses' collection to get the addresses associated with the supplier
        $lookup: {
          from: "addresses",
          localField: "_id",
          foreignField: "userId",
          as: "addresses",
        },
      },
    ]);
  },
  

  findSupplierById: async (id: string , select? : string) => {
    if(select){
      return await User.findById(id).populate("supplierCategory").populate("userType").select(select);
    }
    else{
      return await User.findById(id).populate("supplierCategory").populate("userType");
    }
  },

  updateById: (id: string, data: Partial<supplierAddPayload>) => {
    const updatedSupplier = User.findByIdAndUpdate(id, data, { new: true });
    return updatedSupplier;
  },

  findAddressByUserId: (userId: string) => {
    return Address.find({ userId: userId });
  },

  findAddressandUpdate: (id: string , address: IUserAddress) => {
    return Address.findByIdAndUpdate(id , address , {new: true})
  },

  deleteById: async (id: string) => {
    return await User.findByIdAndDelete(id);
  },

  toggleBlock: (id: string, isBlocked: boolean) => {
    const updateSupplier = User.findByIdAndUpdate(id, { isBlocked: isBlocked }, { new: true });
    if (!updateSupplier) {
      throw new Error("User not found");
    }
    return updateSupplier;
  },

};

