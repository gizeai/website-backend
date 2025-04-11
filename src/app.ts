import express from "express";
import registerRoutes from "@/routes/routes";
import i18next from "@/utils/i18n";
import middleware from "i18next-http-middleware";

const app = express();
app.use(middleware.handle(i18next));
app.use(express.json());
registerRoutes(app);

export default app;
