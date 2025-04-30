import "dotenv/config";
import "@/utils/createDirs";
import "@/utils/verifyEnvs";
import app from "./app";
import DeleteInvalidEnterprises from "./tasks/DeleteInvalidEnterprises";
import InvoicesExpireds from "./tasks/InvoicesExpireds";
import DeleteIncompletePosts from "./tasks/DeleteIncompletePosts";

const port = process.env.EXPRESS_PORT || 3000;

DeleteInvalidEnterprises();
InvoicesExpireds();
DeleteIncompletePosts();

app.listen(port, () => {
  console.info(`Server rodando em http://localhost:${port}`);

  if (process.env.NODE_ENV !== "production") {
    console.info("WebEmail rodando em http://localhost:8025");
  }
});
