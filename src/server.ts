import "dotenv/config";
import app from "./app";

const port = process.env.EXPRESS_PORT || 3000;

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);

  if (process.env.NODE_ENV !== "production") {
    console.log("WebEmail rodando em http://localhost:8025");
  }
});
