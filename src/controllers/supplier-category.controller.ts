    import { supplierCategoryService, supplierService } from "@/services";
    import { Request, Response } from "express";
    import { StatusCodes, ReasonPhrases } from "http-status-codes";

    export const supplierCategoryController = {
        
    addCategory: async (req: Request, res: Response) => {
        try {
        const { name, description, image } = req.body;
        const newSupplierCategory = await supplierCategoryService.createCategory(name, description, image);
        res
            .status(StatusCodes.CREATED)
            .json({ success: true, message: "User category created successfully", data: newSupplierCategory });
        } catch (error) {
        console.error(error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Error creating supplier category" });
        }
    },

    editCategory: async (req: Request, res: Response) => {
        try {
        const { id } = req.params;
        const { name, description, image } = req.body;
        const category = await supplierCategoryService.editCategory(id, { name, description, image });
        res.status(StatusCodes.OK).json({ success: true, message: "Category updated successfully", data: category });
        } catch (error) {
        console.error("Edit Category Error:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Error updating supplier category" });
        }
    },

    deleteCategory: async (req: Request, res: Response) => {
        try {
        const { id } = req.params;
        const result = await supplierCategoryService.deleteCategory(id);
        res.status(StatusCodes.OK).json({ success: true, message: "Category deleted successfully", deletedUser: result });
        } catch (error) {
        console.error("Delete Category Error:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Error deleting supplier category" });
        }
    },

    getAllCategory: async (req: Request, res: Response) => {
        try {
        const categories = await supplierCategoryService.getAllCategory();
        res.status(StatusCodes.OK).json({ success: true, data: categories });
        } catch (error) {
        console.error("View Categories Error:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Error getting all supplier categories" });
        }
    },

    getSpecificCategory: async (req: Request, res: Response) => {
        try {
        const id = req.params.id;
        const result = await supplierCategoryService.getById(id);
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
        const result = await supplierCategoryService.toggleBlock(id, isBlocked);
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
