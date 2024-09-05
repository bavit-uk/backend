import { userController } from "@/controllers";
import { authGuard } from "@/guards";
import { Router } from "express";

export const user = (router: Router) => {
  router.get("/", authGuard.isAuth, authGuard.isAdmin, userController.getAll);

  router.get("/:id", authGuard.isAuth, authGuard.isAdmin, userController.getOne);

  router.post("/", authGuard.isAuth, authGuard.isAdmin, userController.create);

  router.patch("/:id", authGuard.isAuth, authGuard.isAdmin, userController.update);

  router.patch("/:id/password", authGuard.isAuth, authGuard.isAdmin, userController.updatePassword);
};
