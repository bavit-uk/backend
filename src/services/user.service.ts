import { Address, User, UserCategory } from "@/models";
import { IUser, UserCreatePayload } from "@/contracts/user.contract";
import { createHash } from "@/utils/hash.util";
import { IUserAddress } from "@/contracts/user-address.contracts";

export const userService = {

  getAllUsers: async () => {
    return await User.find().populate("userType");
  },

  findUserById: async (id: string , select?: string) => {
    if(select){
        return await User.findById(id).populate("userType").select(select);
    }
    else {
        return await User.findById(id).populate("userType")
    }
  },

  findCategoryById: async (id: string) => {
    return await UserCategory.findById(id);
  },

  createUser: async (data: UserCreatePayload) => {
    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      additionalAccessRights,
      restrictedAccessRights,
      phoneNumber,
      dob,
    //   address,
    } = data;
    const hasedPassword = await createHash(password);
    const newUser = await new User({
      firstName,
      lastName,
      email,
      password: hasedPassword,
      userType,
      additionalAccessRights,
      restrictedAccessRights,
      phoneNumber,
      dob
    });
    return await newUser.save();
  },

  findExistingEmail: async (email: string) => {
    const userExists = await User.findOne({ email });
    return userExists;
  },

  updateById: async (userId: string, updateData: IUser) => {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    return updatedUser;
  },

  deleteById: async (id: string) => {
    return await User.findByIdAndDelete(id);
  },

  toggleBlock: (id: string, isBlocked: boolean) => {
    const updateUser = User.findByIdAndUpdate(id, { isBlocked: isBlocked }, { new: true });
    if (!updateUser) {
      throw new Error("User not found");
    }
    return updateUser;
  },

  createAddress: (address: IUserAddress) => {
    const newAddress = new Address(address);
    return newAddress.save();
  },

  findAddressandUpdate: (id: string , address: IUserAddress) => {
    return Address.findByIdAndUpdate(id , address , {new: true})
  },

  findAddressByUserId: (userId: string) => {
    return Address.find({ userId: userId });
  },

};
