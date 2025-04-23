import EnterpriseService from "@/services/EnterpriseService";
import getMonthKey from "@/utils/getMonthKey";
import { Enterprise } from "@prisma/client";
import i18next from "@/utils/i18n";
import { z } from "zod";

type MetricValues = {
  posts: number;
  credits: number;
  videos: number;
  edits: number;
};

export interface Metrics {
  [year: string]: {
    [month: string]: MetricValues;
  };
}

const MetricsSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      posts: z.number(),
      credits: z.number(),
      videos: z.number(),
      edits: z.number(),
    })
  )
);

export default class EnterpriseMetrics {
  private enterprise: Enterprise;
  private metrics: Metrics;
  private metricProperties: (keyof MetricValues)[] = ["posts", "videos", "edits", "credits"];

  constructor(enterprise: Enterprise) {
    this.enterprise = enterprise;

    console.log("STRING: ", enterprise.metrics);

    const metrics = JSON.parse(enterprise.metrics);

    console.log("JSON: ", metrics);

    if (!MetricsSchema.safeParse(metrics).success) {
      throw new Error(`Invalid metrics format on enterprise '${enterprise.id}'`);
    } else {
      this.metrics = metrics;
    }
  }

  getMetrics() {
    return this.metrics;
  }

  setMetrics(metrics: Metrics) {
    this.metrics = metrics;
  }

  private createMonthKey() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = getMonthKey(date);

    if (!(year in this.metrics)) {
      this.metrics[year] = {};
    }

    if (!(month in this.metrics[year])) {
      this.metrics[year][month] = {
        posts: 0,
        credits: 0,
        videos: 0,
        edits: 0,
      };
    }

    return {
      year,
      month,
    };
  }

  getMonthMetrics() {
    const { month, year } = this.createMonthKey();
    return this.metrics?.[year]?.[month] ?? [];
  }

  increment(increment: Partial<MetricValues>) {
    const { month, year } = this.createMonthKey();

    this.metricProperties.forEach(property => {
      if (increment[property]) {
        this.metrics[year][month][property] += increment[property];
      }
    });
  }

  decrement(decrement: Partial<MetricValues>) {
    const { month, year } = this.createMonthKey();

    this.metricProperties.forEach(property => {
      if (decrement[property]) {
        if (this.metrics[year][month][property] - decrement[property] > 0) {
          this.metrics[year][month][property] -= decrement[property];
        } else {
          this.metrics[year][month][property] = 0;
        }
      }
    });
  }

  async save() {
    const metrics = JSON.stringify(this.metrics);

    return await EnterpriseService.editForce(i18next.t, this.enterprise.id, {
      metrics,
    });
  }
}
