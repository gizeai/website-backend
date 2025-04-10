import { Express, Router } from "express";
import apiRoute from "./api.route";

function registerRoutes(app: Express) {
  const routes: { path: string; router: Router }[] = [apiRoute];

  routes.forEach((route) => {
    app.use(`/api${route.path}`, route.router);
  });
}

export default registerRoutes;
