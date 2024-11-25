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

    editCategory: (id: string, data: { role?: string; description?: string; permissions?: [string] }) => {
        return UserCategory.findByIdAndUpdate(id, data, { new: true });
    },

    deleteCategory: (id: string) => {
        const category = UserCategory.findByIdAndDelete(id);
        if (!category) {
          throw new Error("Category not found");
        }
        return category;
    },


}