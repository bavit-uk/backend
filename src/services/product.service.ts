import { Product } from "@/models";
import { IProduct, IProductUpdatePayload } from "@/contracts/product.contract";

export const productService = {
    
  addProduct: async (productData: IProduct) => {
    try {
      const newProduct = new Product(productData);
      await newProduct.save();
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      throw new Error("Failed to add product to the database");
    }
  },

  getAllProducts: () => {
    return Product.find();
  },

  getById: (id: string) => {
    return Product.findById(id);
  },

  deleteProduct: async (id: string) => {
    return await Product.findByIdAndDelete(id);
  },

  updateProduct: (id: string, data: IProductUpdatePayload) => {
    return Product.findByIdAndUpdate(id, data, { new: true });
  },

  toggleBlock: (id: string, isBlocked: boolean) => {
    const updateProduct = Product.findByIdAndUpdate(id, { isBlocked: isBlocked }, { new: true });
    if (!updateProduct) {
      throw new Error("Product not found");
    }
    return updateProduct;
  },

};
