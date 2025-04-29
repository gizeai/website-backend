import "dotenv/config";
import "@/utils/createDirs";
import "@/utils/verifyEnvs";
import app from "./app";

const port = process.env.EXPRESS_PORT || 3000;

//TODO: Iniciar serviços como de deletar empresas não ativas  que já deram o prazo de 5 dias para evitar comsumo de banco de dados.
//TODO: Iniciar serviços que marcar as invoices expiradas como "pagamento recusado"
//TODO: Iniciar um serviço que deleta todos os Posts não completos criados nas ultimas 6 horas, ele também deve deletar os arquivos de uplaod feito, para não ficar nada boiando.

app.listen(port, () => {
  console.log(`Server rodando em http://localhost:${port}`);

  if (process.env.NODE_ENV !== "production") {
    console.log("WebEmail rodando em http://localhost:8025");
  }
});
