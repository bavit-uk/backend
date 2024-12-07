import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { supplierService } from "@/services";
import { IUserAddress } from "@/contracts/user-address.contracts";
import { createHash } from "@/utils/hash.util";
import { UserCategory } from "@/models";

export const supplierController = {
  addSupplier: async (req: Request, res: Response) => {
    try {
      const { email, address } = req.body;

      console.log(req.body);

      const userExists = await supplierService.findExistingEmail(email);
      if (userExists) {
        return res.status(StatusCodes.CONFLICT).json({ message: "User with this email already exists" });
      }

      // Create the user (supplier)
      const supplier = await supplierService.createSupplier(req.body);
      if (!supplier) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating supplier" });
      }

      // Handle address update/addition if provided
      if (address && Array.isArray(address)) {
        for (const addr of address) {
          const createdAddress = await supplierService.createAddress({ ...addr, userId: supplier._id });
          if (!createdAddress) {
            return res.json({ message: "Error creating address" });
          }
        }
      }

      res.status(StatusCodes.CREATED).json({ message: "Supplier created successfully", supplier: supplier });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating user" });
    }
  },

  editSupplier: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      const { address } = updateData;

      if (updateData.password) {
        updateData.password = await createHash(updateData.password);
      }

      const updatedSupplier = await supplierService.updateById(userId, updateData);
      if (!updatedSupplier) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      }

      // Handle address updates if provided
      if (address && Array.isArray(address)) {
        for (const addr of address) {
          if (addr._id) {
            // Update existing address
            const updatedAddress = await supplierService.findAddressandUpdate(addr._id, addr);
            if (!updatedAddress) {
              return res.status(StatusCodes.NOT_FOUND).json({ message: "Address not found" });
            }
          } else {
            // Create new address if _id is not present
            const createdAddress = await supplierService.createAddress({ ...addr, userId });
            if (!createdAddress) {
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating address" });
            }
          }
        }
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedSupplier,
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while updating the user" });
    }
  },

  getSuppliers: async (req: Request, res: Response) => {
    try {
      // const categories = await UserCategory.findOne({})
      const allSuppliers = await supplierService.getAllSuppliers();
      console.log(allSuppliers)
      res.status(StatusCodes.OK).json({ data: allSuppliers });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  },

  getSupplierById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const supplier = await supplierService.findSupplierById(id, "+password");
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const address = await supplierService.findAddressByUserId(id);

      const supplierWithAddresses = { ...supplier.toObject(), address };

      res.status(200).json({ data: supplierWithAddresses });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching supplier details" });
    }
  },

  deleteSupplier: async (req: Request, res: Response) => {
    try {
      const supplier = await supplierService.deleteById(req.params.id);
      if (!supplier) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      res.status(StatusCodes.OK).json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the supplier" });
    }
  },

  toggleBlock: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { isBlocked } = req.body;
      const result = await supplierService.toggleBlock(userId, isBlocked);
      res.status(StatusCodes.OK).json({
        success: true,
        message: `Supplier Category ${isBlocked ? "blocked" : "unblocked"} successfully`,
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
