import { User , UserCategory } from "@/models";
import { IUser , IUserCategory } from "@/contracts/user.contract";

export const userService = {

    getAllUsers: async () => {
        return await User.find();
    },

    getAllUsersCategories: async () => {
        return await UserCategory.find();
    },

    createCategory: async (userType: string , description: string , permissions: [string]) => {
        const newCategory = await new UserCategory({
            userType,
            description,
            permissions,
        });
        return await newCategory.save();
    },

    findById: async (id: string) => {
        const user = await User.findById(id).populate('userType')
        return user;
    },

    // createUser: async (firstName:string , lastName:string , email:string , password:string , signUpThrough:string , userType:string , additionalAccessRights:[string] , restrictedAccessRights:[string] , phoneNumber:string) => {
        
    //     const newUser = new TestUser ({
    //         firstName, 
    //         lastName,
    //         email,
    //         password,
    //         signUpThrough,
    //         userType,
    //         additionalAccessRights,
    //         restrictedAccessRights,
    //         phoneNumber,
    //     })
    // }

}


