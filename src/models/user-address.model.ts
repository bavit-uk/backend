import mongoose, { Schema, model , Document } from "mongoose";
import { IUserAddress , UserAddressModel} from "@/contracts/user-address.contracts";

const AddressSchema = new Schema<IUserAddress , UserAddressModel>(
    {
      // userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      label: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      isDefault: { type: Boolean, default: false },
    },
    {
      timestamps: true,
    }
);

export const Address = model('Address', AddressSchema);
  