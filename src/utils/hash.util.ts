import { hash } from "bcrypt";

export const createHash = (password: string) => hash(password, 10);
