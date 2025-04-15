import Stripe from "stripe";

export default async function generateStripePaymentLink(
  items: Stripe.PriceCreateParams[],
  external_reference: string
) {
  const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

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
