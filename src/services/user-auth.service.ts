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
    const { firstName, lastName, email, password, signUpThrough } = data;
    // const hasedPassword = await createHash(password);

    const newUser = await new User({
      firstName,
      lastName,
      email,
      password: User.prototype.hashPassword(password),
      signUpThrough,
    });
    return await newUser.save();
  },

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  // New: Find user by reset token
  findUserById: (id: string , select?:string) => {
    if (select) {
      return User.findById(id).select(select);
    }
    return User.findById(id)
  },

  // New: Find user by reset token
  findUserByResetToken: (resetTokenHash: string) => {
    return User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // Token must be valid and not expired
    });
  },

};
