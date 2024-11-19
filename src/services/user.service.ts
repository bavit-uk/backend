import { User , UserCategory } from "@/models";
import { IUser } from "@/contracts/user.contract";
import { createHash } from "@/utils/hash.util";


export const userService = {

    getAllUsers: async () => {
        return await User.find();
    },

    findUserById: async (id: string ) => {
        return await User.findById(id).populate('userType')
    },

    findCategoryById: async (id: string) => {
        return await UserCategory.findById(id);

    },

    createUser: async (data: IUser) => {
        const { firstName, lastName, email, password, signUpThrough, userType, additionalAccessRights, restrictedAccessRights, phoneNumber } = data;
        const hasedPassword = await createHash(password);
        const newUser = await new User ({
            firstName, 
            lastName,
            email,
            password: hasedPassword,
            signUpThrough,
            userType,
            additionalAccessRights,
            restrictedAccessRights,
            phoneNumber,
        });
        return await newUser.save();
    },

    findExistingEmail: async (email: string) => {
        const userExists = await User.findOne({email});
        return userExists;
    },

    updateById: async (userId: string , updateData: IUser) => {
        const updatedUser = await User.findByIdAndUpdate(userId , updateData , {new: true})
        return updatedUser;
    },

    deleteById: async (id: string) => {
        return await User.findByIdAndDelete(id);
    },

    

}


