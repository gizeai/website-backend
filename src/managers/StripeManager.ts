import { Request } from "express";
import Stripe from "stripe";

export default class StripeManager {
  private client: Stripe;
  private signature: string;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  private event: Stripe.Event;

  constructor(req: Request) {
    this.client = StripeManager.createClient();
    this.signature = req.headers["stripe-signature"] as string;
    this.event = this.client.webhooks.constructEvent(req.body, this.signature, this.endpointSecret);
  }

  static createClient() {
    return new Stripe(process.env.STRIPE_API_KEY as string);
  }

  public static async getLink(items: Stripe.PriceCreateParams[], external_reference: string) {
    const stripe = StripeManager.createClient();

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for await (const item of items) {
      const stripePrice = await stripe.prices.create(item);
      line_items.push({ price: stripePrice.id, quantity: 1 });
    }

    const sessions = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: process.env.STRIPE_SUCCESS_CALLBACK as string,
      cancel_url: process.env.STRIPE_FAILURE_CALLBACK as string,
      metadata: { external_reference },
    });

    return sessions.url;
  }

  public getEvent() {
    return this.event;
  }

  public getSession() {
    return this.event.data.object as Stripe.Checkout.Session;
  }
}
