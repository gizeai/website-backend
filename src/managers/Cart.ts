import PLANS, { PlansNamesTypes } from "@/constants/PLANS";
import { Quotes } from "@/types/quotes";
import getQuotes from "@/utils/getQuotes";
import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import MercadoPagoManager from "./MercadoPagoManager";
import StripeManager from "./StripeManager";

export type paymentsType = "stripe" | "mercadopago";
export type recurrencesType = "month" | "year";

export type Products = {
  plan: PlansNamesTypes;
  enterpriseId: string;
  recurrence: recurrencesType;
  external_reference: string;
}[];

interface SuccessReturn {
  success: true;
  link: string;
  status: number;
}

interface ErrorReturn {
  success: false;
  error: string;
  status: number;
}

type Return = SuccessReturn | ErrorReturn;

export default class Cart {
  private products: Products = [];
  private paymentType: paymentsType;

  static getPrice(plan: PlansNamesTypes, recurrence: recurrencesType) {
    const planPrice = PLANS[plan];

    if (!planPrice) {
      throw new Error(`Plan ${plan} not found.`);
    }

    switch (recurrence) {
      case "month":
        return planPrice.price;
      case "year":
        return planPrice.price * 12 * 0.9; //0.9 = 10% OFF;
      default:
        throw new Error(`Recurrence ${recurrence} not found.`);
    }
  }

  constructor(paymentType: paymentsType) {
    this.paymentType = paymentType;
  }

  addProduct(settings: Products[0]) {
    this.products.push(settings);
  }

  getProducts() {
    return this.products;
  }

  private async mercadopago(currency: keyof Quotes["rates"]): Promise<Return> {
    const quotes = await getQuotes();

    const items = this.products.map(product => ({
      id: product.enterpriseId,
      title: `${product.plan} - ${product.recurrence}`,
      unit_price: Cart.getPrice(product.plan, product.recurrence) * (quotes?.rates[currency] ?? 1),
      quantity: 1,
      currency_id: currency,
    }));

    const invoicepack = await prisma.invoicePack.create({
      data: {
        invoices: this.products.map(product => product.external_reference),
      },
    });

    const link = await MercadoPagoManager.getLink(items, invoicepack.id);

    if (link) {
      return {
        success: true,
        status: 200,
        link,
      };
    }

    return {
      success: false,
      status: 500,
      error: "Error generating MercadoPago link.",
    };
  }

  private async stripe(currency: keyof Quotes["rates"]): Promise<Return> {
    const quotes = await getQuotes();
    const items = this.products.map(product => ({
      unit_amount:
        Cart.getPrice(product.plan, product.recurrence) * (quotes?.rates[currency] ?? 1) * 100,
      product: PLANS[product.plan].stripe_product_id,
      currency: currency.toLowerCase(),
    }));

    const invoicepack = await prisma.invoicePack.create({
      data: {
        invoices: this.products.map(product => product.external_reference),
      },
    });

    const link = await StripeManager.getLink(items, invoicepack.id);

    if (link) {
      return {
        success: true,
        status: 200,
        link,
      };
    }

    return {
      success: false,
      status: 500,
      error: "Error generating Stripe link.",
    };
  }

  async link(currency: keyof Quotes["rates"]): Promise<Return> {
    try {
      if (this.paymentType === "mercadopago") {
        return await this.mercadopago(currency);
      } else if (this.paymentType === "stripe") {
        return await this.stripe(currency);
      } else {
        throw new Error(`Method ${this.paymentType} is not implemented.`);
      }
    } catch (error) {
      logger.error(error);
      if (error && typeof error === "object" && "message" in error) {
        return {
          success: false,
          status: 500,
          error: String(error.message),
        };
      }

      return {
        success: false,
        status: 500,
        error: String(error),
      };
    }
  }
}
