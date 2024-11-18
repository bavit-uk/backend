import { UserCategory } from "@/models";


export const userCategoryService = {

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

}