import mongoose, { Schema, model , Document } from "mongoose";
import { IUserAddress , UserAddressModel} from "@/contracts/user-address.contracts";

const AddressSchema = new Schema<IUserAddress , UserAddressModel>(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User"},
      label: { type: String},
      street: { type: String},
      city: { type: String},
      state: { type: String },
      postalCode: { type: String},
      country: { type: String},
      isDefault: { type: Boolean},
    },
    {
      timestamps: true,
    }
);

export const Address = model('Address', AddressSchema);
  