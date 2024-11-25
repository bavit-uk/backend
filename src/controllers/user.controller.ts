import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { User, UserCategory } from "@/models";
import { IUser } from "@/contracts/user.contract";
import { createHash } from "@/utils/hash.util";
import { userService } from "@/services";

export const userController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const { email, address } = req.body;
      // const userExists = await User.findOne({email})
      const userExists = await userService.findExistingEmail(email);
      if (userExists) {
        return res.status(StatusCodes.CONFLICT).json({ message: "User with this email already exists" });
      }

      const userCategory = await userService.findCategoryById(req.body.userType);
      if (!userCategory) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user type" });
      }

      const newUser = await userService.createUser(req.body);
      if (!newUser) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating user" });
      }

      for (const addr of address) {
        const createdAddress = await userService.createAddress({ ...addr, userId: newUser._id });
        if (!createdAddress) {
          return res.json({ message: "Error creating address" });
        }
      }

      res.status(StatusCodes.CREATED).json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating user" });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      const { address } = updateData;
    //   console.log("address : " , address)

      if (updateData.password) {
        updateData.password = await createHash(updateData.password);
      }

      const updatedUser = await userService.updateById(userId, updateData);
      if (!updatedUser) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      }

      // Handle address updates if provided
      if (address && Array.isArray(address)) {
        for (const addr of address) {
          if (addr._id) {
            // Update existing address
            const updatedAddress = await userService.findAddressandUpdate(addr._id, addr);
            if (!updatedAddress) {
              return res.status(StatusCodes.NOT_FOUND).json({ message: "Address not found" });
            }
          } else {
            // Create new address if _id is not present
            const createdAddress = await userService.createAddress({ ...addr, userId });
            if (!createdAddress) {
              return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error creating address" });
            }
          }
        }
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while updating the user" });
    }
  },

  allUsers: async (req: Request, res: Response) => {
    try {
      const users = await userService.getAllUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  },

  getUserDetails: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id; 
      const user = await userService.findUserById(userId , "+password");
      if (!user) return res.status(404).json({ message: "User not found" });
      const userAddresses = await userService.findAddressByUserId(userId);
      res.status(StatusCodes.OK).json({ user , addresses: userAddresses});
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user details" });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const user = await userService.deleteById(req.params.id);
      if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the user" });
    }
  },

  toggleBlock: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { isBlocked } = req.body;
      const result = await userService.toggleBlock(userId, isBlocked);
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
