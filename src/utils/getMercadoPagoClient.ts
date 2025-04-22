import MercadoPagoConfig from "mercadopago";

export default function getMercadoPagoClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
  });
}
