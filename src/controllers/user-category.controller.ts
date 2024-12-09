import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { userCategoryService } from "@/services";

export const userCategoryController = {
  // controller for get all users categories
  allUsersCategories: async (req: Request, res: Response) => {
    try {
      const usersCategories = await userCategoryService.getAllUsersCategories();
      console.log(usersCategories);
      res.status(StatusCodes.OK).json(usersCategories);
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user categories", error: error });
    }
  },

  // controller for post new user category
  createUserCategory: async (req: Request, res: Response) => {
    try {
      const { role, description, permissions } = req.body;
      // console.log("sdad : " , role , description)
      const newUserCategory = await userCategoryService.createCategory(role, description, permissions);
      // console.log(newUserCategory)
      res
        .status(StatusCodes.CREATED)
        .json({ message: "User category created successfully", userCategory: newUserCategory });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating user category" });
    }
  },

  editCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, description, permissions } = req.body;
      const category = await userCategoryService.editCategory(id, { role, description, permissions });
      res.status(StatusCodes.OK).json({ success: true, message: "Category updated successfully", data: category });
    } catch (error) {
      console.error("Edit Category Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error updating category" });
    }
  },

  deleteCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await userCategoryService.deleteCategory(id);
      res.status(StatusCodes.OK).json({ success: true, message: "Category deleted successfully", deletedUser: result });
    } catch (error) {
      console.error("Delete Category Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error deleting category" });
    }
  },

  getSpecificCategory: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await userCategoryService.getById(id);
      //   console.log(result);
      if (!result) return res.status(404).json({ message: "Category not found" });
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      console.error("View Category Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error getting supplier category" });
    }
  },

  toggleBlock: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;
      console.log("id : ", id);
      const result = await userCategoryService.toggleBlock(id, isBlocked);
      res.status(StatusCodes.OK).json({
        success: true,
        message: `Category ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: result,
      });
    } catch (error) {
      console.error("Toggle Block Category Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error updating supplier category status" });
    }
  },
};
