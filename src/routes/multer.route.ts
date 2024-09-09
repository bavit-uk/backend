import { multerController } from "@/controllers/multer.controller";
import { uploadMiddleware } from "@/middlewares/multer.middleware";
import { Router } from "express";

export const multer = (router: Router) => {
  router.post("/upload", uploadMiddleware, multerController.upload);
};
