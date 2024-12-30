import { Product } from "@/models";
import { IProductUpdatePayload } from "@/contracts/product.contract";

export const productService = {
  // Add a new product
  addProduct: async (productData: any) => {
    try {
      const newProduct = new Product(productData);
      await newProduct.save();
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      throw new Error("Failed to add product");
    }
  },

  // Get all products
  getAllProducts: async () => {
    try {
      return await Product.find();
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  // Get a product by ID for a specific platform
  getProductById: async (
    id: string,
    platform: "amazon" | "ebay" | "website"
  ) => {
    try {
      const product = await Product.findById(id);

      if (!product) throw new Error("Product not found");

      if (product.platformDetails[platform]) {
        return product.platformDetails[platform];
      }

      throw new Error(`No details found for platform: ${platform}`);
    } catch (error) {
      console.error(
        `Error fetching product by ID for platform ${platform}:`,
        error
      );
      throw new Error("Failed to fetch product");
    }
  },

  // Update product details for a specific platform
  updateProduct: async (
    id: string,
    platform: "amazon" | "ebay" | "website",
    data: IProductUpdatePayload
  ) => {
    try {
      const updateQuery = { [`platformDetails.${platform}`]: data };

      const updatedProduct = await Product.findByIdAndUpdate(id, updateQuery, {
        new: true,
      });
      if (!updatedProduct) throw new Error("Product not found");

      return updatedProduct.platformDetails[platform];
    } catch (error) {
      console.error(`Error updating product for platform ${platform}:`, error);
      throw new Error("Failed to update product");
    }
  },

  // Toggle block status for a product
  toggleBlock: async (id: string, isBlocked: boolean) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
      );
      if (!updatedProduct) throw new Error("Product not found");

      return updatedProduct;
    } catch (error) {
      console.error("Error toggling block status:", error);
      throw new Error("Failed to toggle block status");
    }
  },
};
