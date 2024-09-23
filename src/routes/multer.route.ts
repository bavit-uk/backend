import { multerController } from "@/controllers/multer.controller";
import { authGuard } from "@/guards";
import { authMiddleware } from "@/middlewares";
import { uploadMiddleware } from "@/middlewares/multer.middleware";
import { Router } from "express";

export const multer = (router: Router) => {
  router.post("/upload", authGuard.isAuth, uploadMiddleware, multerController.upload);
};
