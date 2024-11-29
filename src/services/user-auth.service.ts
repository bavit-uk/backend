import { Address, User, UserCategory } from "@/models";
import { IUser } from "@/contracts/user.contract";
import { UserRegisterPayload } from "@/contracts/user-auth.contract";
import { createHash } from "@/utils/hash.util";
import { IUserAddress } from "@/contracts/user-address.contracts";

export const authService = {
  findExistingEmail: (email: string, select?: string) => {
    if (select) {
      return User.findOne({ email }).select(select);
    }
    return User.findOne({ email });
  },

  createUser: async (data: UserRegisterPayload) => {
    const { firstName, lastName, email, password, signUpThrough , phoneNumber } = data;
    // const hasedPassword = await createHash(password);

    const newUser = await new User({
      firstName,
      lastName,
      email,
      password: User.prototype.hashPassword(password),
      signUpThrough,
      phoneNumber
    });
    return await newUser.save();
  },

  findAddressByUserId: (userId: string) => {
    return Address.find({ userId: userId });
  },

  findAddressandUpdate: (id: string , address: IUserAddress) => {
    return Address.findByIdAndUpdate(id , address , {new: true})
  },

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  // New: Find user by reset token
  findUserById: (id: string , select?:string) => {
    if (select) {
      return User.findById(id).select(select).populate("userType");
    }
    return User.findById(id).populate("userType")
  },

  // New: Find user by reset token
  findUserByResetToken: (resetTokenHash: string) => {
    return User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // Token must be valid and not expired
    });
  },

};
