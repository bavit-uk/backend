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

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  createSupplier: async (data: supplierAddPayload) => {
    // console.log("data in service : " , data)
    const { firstName, lastName, email, password, phoneNumber, supplierCategory, address, documents } = data;
    // const {label , street , state , postalCode , country , isDefault } = address;
    // console.log("address in service : " , address)
    const hashedPassword = await createHash(password);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      supplierCategory,
      documents,
    });
    return user.save();
  },

  getAllSuppliers: () => {
    return User.find();
  },

  findSupplierById: (id: string) => {
    return User.findById(id).populate("supplierCategory").populate("address");
  },

  updateById: (id: string, data: Partial<supplierAddPayload>) => {
    const updatedSupplier = User.findByIdAndUpdate(id, data, { new: true });
    return updatedSupplier;
  },

  // Update supplier's non-address data
  updateSupplierData: async (supplierId: string, data: Partial<supplierAddPayload>) => {
    const updatedSupplier = await User.findByIdAndUpdate(supplierId, data, { new: true });
    return updatedSupplier;
  },

  // Update, Add, or Remove addresses based on new input
  updateAddresses: async (existingAddressIds: mongoose.Types.ObjectId[], newAddresses: IUserAddress[]) => {
    const updatedAddressIds: mongoose.Types.ObjectId[] = [];

    for (const address of newAddresses) {
      if (address._id && existingAddressIds.includes(address._id)) {
        // Update existing address
        await Address.findByIdAndUpdate(address._id, address);
        updatedAddressIds.push(address._id);
      } else {
        // Add new address
        const newAddress = new Address(address);
        const savedAddress = await newAddress.save();
        updatedAddressIds.push(savedAddress._id);
      }
    }
  },

};

// label: { type: String, required: true },
//   street: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   postalCode: { type: String, required: true },
//   country: { type: String, required: true },
//   isDefault: { type: Boolean, default: false },
