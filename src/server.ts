import "dotenv/config";
import "@/utils/createDirs";
import app from "./app";

const port = process.env.EXPRESS_PORT || 3000;

//TODO: Iniciar serviços como de deletar empresas não ativas  que já deram o prazo de 5 dias para evitar comsumo de banco de dados.
//TODO: Iniciar serviços que marcar as invoices expiradas como "pagamento recusado"

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);

  if (process.env.NODE_ENV !== "production") {
    console.log("WebEmail rodando em http://localhost:8025");
  }
});
