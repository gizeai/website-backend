import { Router } from "express";

const apiRouter = Router();

apiRouter.get("/", async (req, res) => {
  res.send("Hello, Express + TypeScript!");
});

export default {
  path: "/",
  router: apiRouter,
};
