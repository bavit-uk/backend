import { compareSync } from "bcrypt";

export const comparePassword = (password: string, hash: string) => compareSync(password, hash);
