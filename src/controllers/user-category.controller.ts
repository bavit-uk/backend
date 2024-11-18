import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { userCategoryService } from "@/services";


export const userCategoryController = { 

    // controller for get all users categories 
    allUsersCategories: async (req: Request , res: Response) => {
        try {
            const usersCategories = await userCategoryService.getAllUsersCategories();
            res.status(StatusCodes.OK).json(usersCategories);
        } catch (error) {
            console.log(error)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user categories", error: error  });
        }
    },

    // controller for post new user category
    createUserCategory: async (req: Request, res: Response) => {
        try {
            const { userType, description, permissions } = req.body;
            const newUserCategory = userCategoryService.createCategory(userType , description , permissions)
            res.status(StatusCodes.CREATED).json({ message: 'User category created successfully', userCategory: newUserCategory });
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating user category' });
        }
    },

}