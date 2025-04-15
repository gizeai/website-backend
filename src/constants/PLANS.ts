import deepFreezeObject from "@/utils/deepFreezeObject";

//TODO: Criar os produtos lá na Stripe
const PLANS = {
  flash: {
    name: "Flash",
    price: 9.9,
    users: 2,
    credits: 5,
    stripe_product_id: "product_dawidjawoidjaowidj",
  },
  creator: {
    name: "Creator",
    price: 25,
    users: 5,
    credits: 15,
    stripe_product_id: "product_dawidjawoidjaowidj",
  },
  influencer: {
    name: "Influencer",
    price: 59,
    users: 10,
    credits: 40,
    stripe_product_id: "product_dawidjawoidjaowidj",
  },
  viral: {
    name: "Viral",
    price: 139,
    users: 25,
    credits: 100,
    stripe_product_id: "product_dawidjawoidjaowidj",
  },
};

export type PlansNamesTypes = keyof typeof PLANS;
export default deepFreezeObject<typeof PLANS>(PLANS);
