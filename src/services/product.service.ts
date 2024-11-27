import { Product } from "@/models"; 
import { IProduct } from "@/contracts/product.contract"; 

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

    


}