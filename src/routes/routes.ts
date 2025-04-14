import { Express, Router } from "express";
import apiRoute from "./api.route";
import userRoute from "./user.route";
import authRoute from "./auth.route";
import uploadRoute from "./upload.route";

function registerRoutes(app: Express) {
  const routes: { path: string; router: Router }[] = [apiRoute, userRoute, authRoute, uploadRoute];

  routes.forEach((route) => {
    app.use(`/api${route.path}`, route.router);
  });
}

export default registerRoutes;
