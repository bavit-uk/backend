import { productService } from "@/services";
import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

export const productController = {

  addProduct: async (req: Request, res: Response) => {
    try {
      const productData = req.body; 
      console.log("asdasd : ", productData);
      const newProduct = await productService.addProduct(productData); // Call the service to add the product
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Product added successfully",
        data: newProduct,
      });
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error adding product",
      });
    }
  },

  getAllProduct: async (req: Request, res: Response) => {
    try {
      const products = await productService.getAllProducts();
      res.status(StatusCodes.OK).json({ success: true, products: products });
    } catch (error) {
      console.error("View Products Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error getting all products" });
    }
  },

  getProductById: async (req: Request, res: Response) => {
    try {
      const prodId = req.params.id;
      console.log(prodId)
      const product = await productService.getById(prodId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.status(StatusCodes.OK).json({ success: true , product: product });
    } catch (error) {
      console.error("View Product Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error getting product" });
    }
  },

  // deleteProduct: async (req: Request, res: Response) => {
  //   try {
  //     const userId = req.params.id
  //     const product = await productService.deleteProduct(userId);
  //     res.status(StatusCodes.OK).json({ message: "Product deleted successfully" });
  //     if (!product) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
  //   } catch (error) {
  //     console.error("Error deleting product:", error);
  //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the product" });
  //   }
  // },

  updateProductById: async (req: Request, res: Response) => {
    try {
        // console.log("hello")
        const prodId = req.params.id;
        const data = req.body
        // console.log(prodId)
        // console.log(data)
        const product = await productService.updateProduct(prodId , data)
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(StatusCodes.OK).json({ success: true, product: product });
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error updating product" });
    }
  },

  toggleBlock: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { isBlocked } = req.body;
      const result = await productService.toggleBlock(userId, isBlocked);
      res.status(StatusCodes.OK).json({
        success: true,
        message: `Product ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: result,
      });
    } catch (error) {
      console.error("Toggle Block Error:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error updating product status" });
    }
  }

};
