import { Express, Router } from "express";
import apiRoute from "./api.route";

function registerRoutes(app: Express) {
  console.info("Montando rotas...");

  const routes: { path: string; router: Router }[] = [apiRoute];

  routes.forEach((route) => {
    app.use(`/api${route.path}`, route.router);
    console.info(`Rota "/api${route.path}" montada com sucesso!`);
  });

  console.info("Rotas montadas com sucesso!");
}

export default registerRoutes;
