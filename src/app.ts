import express from "express";
import registerRoutes from "@/routes/routes";
import i18next from "@/utils/i18n";
import middleware from "i18next-http-middleware";
import bodyParser from "body-parser";

const app = express();
app.use(middleware.handle(i18next));
app.use(
  bodyParser.json({
    limit: "10mb",
  })
);

registerRoutes(app);

export default app;
