import "dotenv/config";
import express from "express";
import registerRoutes from "@/routes/routes";

const app = express();
const port = process.env.EXPRESS_PORT || 3000;

app.use(express.json());

registerRoutes(app);

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);
});
