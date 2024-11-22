import { UserCategory } from "@/models";


export const userCategoryService = {

    getAllUsersCategories:  () => {
        return UserCategory.find();
    },

    createCategory:  (role: string , description: string , permissions: [string]) => {
        const newCategory = new UserCategory({
            role,
            description,
            permissions,
        });
        return newCategory.save();
    },

}