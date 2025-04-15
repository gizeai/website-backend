import MercadoPagoConfig, { Preference } from "mercadopago";
import { Items } from "mercadopago/dist/clients/commonTypes";

export default async function generateMercadoPagoPaymentLink(
  items: Array<Items>,
  external_reference: string
) {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
  });

  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: items,
      external_reference: external_reference,
      auto_return: "approved",
      back_urls: {
        success: process.env.MERCADO_PAGO_SUCCESS_CALLBACK as string,
        pending: process.env.MERCADO_PAGO_PENDING_CALLBACK as string,
        failure: process.env.MERCADO_PAGO_FAILURE_CALLBACK as string,
      },
    },
  });

  return response.init_point ?? null;
}
