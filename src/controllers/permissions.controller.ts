import { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

export const permissionsController = {
  getPermissions: (req: Request, res: Response) => {
    try {
        const permissions = {
          dashboard: {
            parent: "DASHBOARD",
          },
            userManagement: {
              parent: "MANAGE_USERS",
              children: ["ADD_CATEGORY", "VIEW_CATEGORY", "ADD_USER", "VIEW_USER"],
            },
            supplierManagement: {
              parent: "MANAGE_SUPPLIERS",
              children: ["ADD_SUPPLIERS_CATEGORY", "VIEW_SUPPLIERS_CATEGORY", "ADD_SUPPLIERS", "VIEW_SUPPLIERS"],
            },
              setting: {
                parent: "SETTINGS"
              }
          };
          console.log(permissions);

      res.status(StatusCodes.CREATED).json({
        success: true,
        permissions: permissions,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error getting permissions",
      });
    }
  },
};
