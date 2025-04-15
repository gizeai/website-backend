import { PlansNamesTypes } from "@/constants/PLANS";
import { recurrencesType } from "@/managers/Payments";
import MercadoPagoConfig, { Preference } from "mercadopago";

export default async function generateMercadoPagoPaymentLink(
  external_reference: string,
  price: number,
  currency: string,
  plan: PlansNamesTypes,
  recurrence: recurrencesType
) {
  const client = new MercadoPagoConfig({
    accessToken: "<ACCESS_TOKEN>",
    options: { timeout: 5000 },
  });

  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: [
        {
          id: external_reference,
          title: `${plan} - ${recurrence}`,
          unit_price: price,
          quantity: 1,
          currency_id: currency,
        },
      ],
      external_reference: external_reference,
      notification_url: "https://webhook.site/sua-url",
      auto_return: "approved",
      back_urls: {
        success: "https://seusite.com/sucesso",
        pending: "https://seusite.com/pendente",
        failure: "https://seusite.com/falha",
      },
    },
  });

  return response.init_point ?? null;
}
