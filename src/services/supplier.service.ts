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
    const { firstName, lastName, email, password, phoneNumber, supplierCategory, documents } = data;

    // Here this id refers to the supplier in user category
    const supplierId = "67403baee189e381d5f1cdc6";
    const hashedPassword = await createHash(password);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      supplierCategory,
      userType: supplierId,
      documents,
    });

    return user.save();
  },

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  getAllSuppliers: () => {
    // return User.find().populate("userType");
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

  findSupplierById: async (id: string) => {
    console.log("idd : " , id)
    const supplier = await User.findById(id).populate("supplierCategory").populate("userType");
    console.log("supplier : " , supplier)
    if (!supplier) {
      return null;
    }
    const addresses = await Address.find({ userId: id });
    console.log("adresses in service" , addresses)
    return {
      ...supplier.toObject(),
      addresses,
    };
  },

  updateAddresses: async (supplierId: string , address: Partial<IUserAddress>) => {
    const updatedAddress = await Address.findOneAndUpdate({userId: supplierId} , address , {new: true})
    // console.log("updatedAddress : " , updatedAddress)
    return updatedAddress;
  },

//   updateById: (id: string, data: Partial<supplierAddPayload>) => {
//     const updatedSupplier = User.findByIdAndUpdate(id, data, { new: true });
//     return updatedSupplier;
//   },

//   // Update supplier's non-address data
//   updateSupplierData: async (supplierId: string, data: Partial<supplierAddPayload>) => {
//     const updatedSupplier = await User.findByIdAndUpdate(supplierId, data, { new: true });
//     return updatedSupplier;
//   },

//   // Update, Add, or Remove addresses based on new input
//   updateAddresses: async (existingAddressIds: mongoose.Types.ObjectId[], newAddresses: IUserAddress[]) => {
//     const updatedAddressIds: mongoose.Types.ObjectId[] = [];

//     for (const address of newAddresses) {
//       if (address._id && existingAddressIds.includes(address._id)) {
//         // Update existing address
//         await Address.findByIdAndUpdate(address._id, address);
//         updatedAddressIds.push(address._id);
//       } else {
//         // Add new address
//         const newAddress = new Address(address);
//         const savedAddress = await newAddress.save();
//         updatedAddressIds.push(savedAddress._id);
//       }
//     }
//   },

};

// label: { type: String, required: true },
//   street: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   postalCode: { type: String, required: true },
//   country: { type: String, required: true },
//   isDefault: { type: Boolean, default: false },
