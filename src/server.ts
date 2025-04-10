import "dotenv/config";
import app from "./app";

const port = process.env.EXPRESS_PORT || 3000;

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);
});
