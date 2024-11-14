import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { User , UserCategory} from "@/models";
import { IUser , IUserCategory } from "@/contracts/user.contract"
// import bcrypt from 'bcrypt'; 
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

    allUsersCategories: async (req: Request , res: Response) => {
        try {
            const usersCategories = await userService.getAllUsersCategories();
            res.status(StatusCodes.OK).json(usersCategories);
        } catch (error) {
            console.log(error)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching user categories", error: error  });
        }
    },

    createUserCategory: async (req: Request, res: Response) => {
        try {
            const { userType, description, permissions } = req.body;

            // Create a new user category
            // const newUserCategory = new UserCategory({
            //     userType,
            //     description,
            //     permissions
            // });
            const newUserCategory = userService.createCategory(userType , description , permissions)
            res.status(StatusCodes.CREATED).json({ message: 'User category created successfully', userCategory: newUserCategory });
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating user category' });
        }
    },

    getUserDetails: async (req: Request, res: Response) => {
        try {
            const userId = req.params.id // req.userId // Assume you have a way to get the logged-in user's ID
            const user = await User.findById(userId).populate('userType');
            if (!user) return res.status(404).json({ message: 'User not found' });
    
            // const userType = user.userType as IUserCategory;
    
            // const userDetails = {
            //     userType: userType.userType, // Get the role of the user
            //     permissions: userType.permissions,
            //     additionalAccessRights: user.additionalAccessRights,
            //     restrictedAccessRights: user.restrictedAccessRights,
            // };
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching user details' });
        }
    },

    createUser: async (req: Request, res: Response) => {
        try {
            const { firstName, lastName, email, password, signUpThrough, userType, additionalAccessRights, restrictedAccessRights, phoneNumber } = req.body;
            // console.log("Hello world" , firstName, lastName, email, password, signUpThrough, userType, additionalAccessRights, restrictedAccessRights, phoneNumber)
            const hashedPassword = await createHash(password)

            const userCategory = await UserCategory.findById(userType);
            if (!userCategory) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid user type' });
            }
            // console.log("User Category : " , userCategory);
            // console.log("hello")
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                signUpThrough,
                // profileImage,
                userType: userCategory._id,
                additionalAccessRights,
                restrictedAccessRights,
                phoneNumber
            });

            await newUser.save();
            res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user: newUser });
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error creating user' });
        }
    },

}


