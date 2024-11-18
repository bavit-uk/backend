import { User , UserCategory } from "@/models";
import { IUser } from "@/contracts/user.contract";
import { UserRegisterPayload } from "@/contracts/user-auth.contract";
import { createHash } from "@/utils/hash.util";

export const authService = {

    findExistingEmail:  (email: string , select?:string) => {
        if(select) {
            return User.findOne({ email }).select(select);
        }
        return User.findOne({ email });
    },

    createUser: async (data:UserRegisterPayload) => {
        const { firstName, lastName, email, password, signUpThrough} = data;
        // const hasedPassword = await createHash(password);

        const newUser = await new User ({
            firstName, 
            lastName,
            email,
            password:User.prototype.hashPassword(password),
            signUpThrough,
        });
        return await newUser.save();

    }

}
