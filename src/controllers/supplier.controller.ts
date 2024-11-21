import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { supplierService } from "@/services";
import { IUserAddress } from "@/contracts/user-address.contracts";
import { createHash } from "@/utils/hash.util";

export const supplierController = {

  addSupplier: async (req: Request, res: Response) => {
    try {
      const { email, address } = req.body;

      // console.log("User with Address : " , address)
      const userExists = await supplierService.findExistingEmail(email);
      if (userExists) {
        return res.status(StatusCodes.CONFLICT).json({ message: "User with this email already exists" });
      }
      const addressIds = [];
      for (const addr of address) {
        const createdAddress = await supplierService.createAddress(addr);
        if (!createdAddress) {
          return res.json({ message: "Error creating address" });
        }
        addressIds.push(createdAddress._id);
      }
      //   console.log("address ids array : " , addressIds)
      const supplier = await supplierService.createSupplier({ ...req.body, address: addressIds });
      res.status(StatusCodes.CREATED).json({ message: "Supplier created successfully", supplier: supplier });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating user" });
    }
  },

  getSuppliers: async (req: Request, res: Response) => {
    try {
      const allSuppliers = await supplierService.getAllSuppliers();
      res.status(StatusCodes.OK).json({ data: allSuppliers });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  },

  getSupplierById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const supplier = await supplierService.findSupplierById(id);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      res.status(StatusCodes.OK).json({ data: supplier });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching supplier details" });
    }
  },

  editSupplier: async (req: Request, res: Response) => {
    try {
      const supplierId = req.params.id; // Get supplier ID from route parameters
      const { address: newAddresses, ...supplierData } = req.body;

      // Update the non-address fields for the supplier
      const updatedSupplier = await supplierService.updateSupplierData(supplierId, supplierData);

      if (!updatedSupplier) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "Supplier not found" });
      }

      // Process addresses
      const updatedAddressIds = await supplierService.updateAddresses(updatedSupplier.address, newAddresses);

      // Update the supplier document with the new address IDs
      updatedSupplier.address = updatedAddressIds;
      await updatedSupplier.save();

      res.status(StatusCodes.OK).json({ message: "Supplier updated successfully", supplier: updatedSupplier });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error updating supplier" });
    }
  },

};
