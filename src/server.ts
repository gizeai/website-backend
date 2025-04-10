import "dotenv/config";
import express from "express";
import registerRoutes from "@/routes/routes";

const app = express();
const port = 3000;

app.use(express.json());

registerRoutes(app);

app.get("/", (req, res) => {
  res.send("Hello, Express + TypeScript!");
});

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);
});
