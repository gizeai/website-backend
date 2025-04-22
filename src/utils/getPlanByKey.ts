import PLANS, { PlansNamesTypes } from "@/constants/PLANS";

export default function getPlanByKey(plan: string) {
  const plans = PLANS;
  const plancode = plan.toLowerCase();

  return plans[plancode as PlansNamesTypes];
}
