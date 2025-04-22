import MercadoPagoConfig, { Payment, Preference } from "mercadopago";
import { Items } from "mercadopago/dist/clients/commonTypes";
import crypto from "crypto";
import { Request } from "express";

export interface WebhookNotification {
  type: string;
  data: {
    id: string;
  };
}

export type MercadoPagoPaymentStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "cancelled"
  | "in_process"
  | "in_mediation"
  | "charged_back";

export default class MercadoPagoManager {
  private client: MercadoPagoConfig;
  private secretKey = process.env.MERCADO_PAGO_SECRET_KEY as string;
  private signature: string;
  private body: WebhookNotification;

  constructor(req: Request) {
    this.client = MercadoPagoManager.createClient();
    this.signature = req.headers["x-signature"] as string;
    this.body = req.body as WebhookNotification;
  }

  static createClient() {
    return new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
    });
  }

  static fromRequest(req: Request) {
    return new MercadoPagoManager(req);
  }

  public static async getLink(items: Array<Items>, external_reference: string) {
    const preference = new Preference(MercadoPagoManager.createClient());

    const response = await preference.create({
      body: {
        items: items,
        external_reference: external_reference,
        back_urls: {
          success: process.env.MERCADO_PAGO_SUCCESS_CALLBACK as string,
          pending: process.env.MERCADO_PAGO_PENDING_CALLBACK as string,
          failure: process.env.MERCADO_PAGO_FAILURE_CALLBACK as string,
        },
      },
    });

    return response.init_point ?? null;
  }

  public getClient() {
    return this.client;
  }

  public getBody() {
    return this.body;
  }

  public validateSignature() {
    if (!this.signature) return false;

    const [tsPart, signaturePart] = this.signature.split(",");
    const timestamp = tsPart.split("=")[1];
    const expectedSignature = signaturePart.split("=")[1];

    const data = JSON.stringify(this.body);
    const computedSignature = crypto
      .createHmac("sha256", this.secretKey)
      .update(`${timestamp}.${data}`)
      .digest("hex");

    return computedSignature === expectedSignature;
  }

  public async getPayment(paymentId: string) {
    const paymentClient = new Payment(this.client);
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  }
}
