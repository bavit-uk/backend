import { Router } from "express";

// Routes
import { auth } from "./auth.route";
import { healthcheck } from "./healthcheck.route";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { user as users } from "./user.route";
import { multer as files } from "./multer.route";

// Create a new router to handle all routes
const router: Router = Router();

// Define all routes
const routes: {
  [key: string]: (router: Router) => void;
} = { auth, healthcheck, users, files };

// Loop through all routes and pass the router to each route
for (const route in routes) {
  // Add the route to the router
  const routeHandler = routes[route];
  const basePath = `/${route.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
  const tempRouter = Router();

  routeHandler(tempRouter);
  router.use(basePath, tempRouter);
}

router.all("*", (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: ReasonPhrases.NOT_FOUND,
    status: StatusCodes.NOT_FOUND,
  });
});

// Export the router
export { router };
