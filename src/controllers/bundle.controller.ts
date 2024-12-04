import { Request, Response } from "express";

export const bundleController = {
    createBundleInventory: async (req:Request,res:Response) => {
try {
    const bundle =bundleService.createBundle(req.body);
} catch (error) {
    
}

    },
}