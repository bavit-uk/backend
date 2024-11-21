import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { User , UserCategory} from "@/models";
import { IUser } from "@/contracts/user.contract"
import { createHash } from "@/utils/hash.util";
import { userService } from "@/services";

export const userController = {

    allUsers: async (req: Request , res: Response) => {
        try {
            const users = await userService.getAllUsers()
            res.status(StatusCodes.OK).json(users);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
        }
    },


    getUserDetails: async (req: Request, res: Response) => {
        try {
            const userId = req.params.id // req.userId // Assume you have a way to get the logged-in user's ID
            // const user = await User.findById(userId).populate('userType');
            const user = await userService.findUserById(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
    
            // const userType = user.userType as IUserCategory;
    
            // const userDetails = {
            //     userType: userType.userType, // Get the role of the user
            //     permissions: userType.permissions,
            //     additionalAccessRights: user.additionalAccessRights,
            //     restrictedAccessRights: user.restrictedAccessRights,
            // };
            res.status(StatusCodes.OK).json(user);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching user details' });
        }
    },

    createUser: async (req: Request, res: Response) => {
        try {
            const { email } = req.body
            // const userExists = await User.findOne({email})
            const userExists = await userService.findExistingEmail(email)
            if(userExists){
                return res.status(StatusCodes.CONFLICT).json({ message: "User with this email already exists" });
            }

            const userCategory = await userService.findCategoryById(req.body.userType);
            if (!userCategory) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid user type' });
            }

            const newUser = await userService.createUser(req.body)
            res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user: newUser });
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating user' });
        }
    },

    updateUser: async (req:Request , res: Response) => {
        try {
            const userId = req.params.id
            const updateData = req.body;

            // console.log(userId)
            // console.log(updateData)

            if (updateData.password) {
                updateData.password = await createHash(updateData.password)
            }

            const updatedUser = await userService.updateById(userId , updateData)
            if (!updatedUser) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
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

    deleteUser: async (req:Request , res: Response) => {
        try {
            const user = await userService.deleteById(req.params.id)
            if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
            res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while deleting the user" });
        }
    },

}


