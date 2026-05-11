import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

type OverviewRow = {
  total_revenue: string;
  total_orders: string;
  total_customers: string;
  average_order_value: string;
};

type SeriesRow = {
  label: string;
  value: string;
  orders?: string;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async refresh() {
    await this.databaseService.query("TRUNCATE analytics.fact_sales RESTART IDENTITY");
    await this.databaseService.query(
      "TRUNCATE analytics.dim_product, analytics.dim_customer, analytics.dim_region, analytics.dim_campaign RESTART IDENTITY CASCADE",
    );

    await this.databaseService.query(`
      INSERT INTO analytics.dim_product (product_sku, product_name)
      SELECT DISTINCT product_sku, product_name
      FROM staging.orders
      ORDER BY product_sku
    `);

    await this.databaseService.query(`
      INSERT INTO analytics.dim_customer (customer_email)
      SELECT DISTINCT customer_email
      FROM staging.orders
      ORDER BY customer_email
    `);

    await this.databaseService.query(`
      INSERT INTO analytics.dim_region (region_name)
      SELECT DISTINCT region
      FROM staging.orders
      ORDER BY region
    `);

    await this.databaseService.query(`
      INSERT INTO analytics.dim_campaign (campaign_name)
      SELECT DISTINCT COALESCE(campaign, 'unattributed')
      FROM staging.orders
      ORDER BY COALESCE(campaign, 'unattributed')
    `);

    const factResult = await this.databaseService.query(`
      INSERT INTO analytics.fact_sales (
        order_id, order_date, product_key, customer_key, region_key, campaign_key,
        quantity, unit_price, revenue, source_id, job_id
      )
      SELECT
        s.order_id,
        s.order_date,
        p.product_key,
        c.customer_key,
        r.region_key,
        m.campaign_key,
        s.quantity,
        s.unit_price,
        s.revenue,
        s.source_id,
        s.job_id
      FROM staging.orders s
      JOIN analytics.dim_product p ON p.product_sku = s.product_sku
      JOIN analytics.dim_customer c ON c.customer_email = s.customer_email
      JOIN analytics.dim_region r ON r.region_name = s.region
      JOIN analytics.dim_campaign m ON m.campaign_name = COALESCE(s.campaign, 'unattributed')
      RETURNING sales_key
    `);

    return {
      status: "refreshed",
      factRows: factResult.rowCount ?? 0,
      refreshedAt: new Date().toISOString(),
    };
  }

  async overview() {
    const result = await this.databaseService.query<OverviewRow>(`
      SELECT
        COALESCE(SUM(revenue), 0)::text AS total_revenue,
        COUNT(*)::text AS total_orders,
        COUNT(DISTINCT customer_key)::text AS total_customers,
        COALESCE(AVG(revenue), 0)::text AS average_order_value
      FROM analytics.fact_sales
    `);
    const row = result.rows[0];

    return {
      totalRevenue: Number(row.total_revenue),
      totalOrders: Number(row.total_orders),
      totalCustomers: Number(row.total_customers),
      averageOrderValue: Number(row.average_order_value),
    };
  }

  async revenueByDay() {
    const result = await this.databaseService.query<SeriesRow>(`
      SELECT order_date::text AS label, SUM(revenue)::text AS value, COUNT(*)::text AS orders
      FROM analytics.fact_sales
      GROUP BY order_date
      ORDER BY order_date
    `);

    return result.rows.map((row) => this.toSeriesPoint(row));
  }

  async revenueByProduct() {
    const result = await this.databaseService.query<SeriesRow>(`
      SELECT p.product_name AS label, SUM(f.revenue)::text AS value, COUNT(*)::text AS orders
      FROM analytics.fact_sales f
      JOIN analytics.dim_product p ON p.product_key = f.product_key
      GROUP BY p.product_name
      ORDER BY SUM(f.revenue) DESC
    `);

    return result.rows.map((row) => this.toSeriesPoint(row));
  }

  async revenueByRegion() {
    const result = await this.databaseService.query<SeriesRow>(`
      SELECT r.region_name AS label, SUM(f.revenue)::text AS value, COUNT(*)::text AS orders
      FROM analytics.fact_sales f
      JOIN analytics.dim_region r ON r.region_key = f.region_key
      GROUP BY r.region_name
      ORDER BY SUM(f.revenue) DESC
    `);

    return result.rows.map((row) => this.toSeriesPoint(row));
  }

  async revenueByCampaign() {
    const result = await this.databaseService.query<SeriesRow>(`
      SELECT c.campaign_name AS label, SUM(f.revenue)::text AS value, COUNT(*)::text AS orders
      FROM analytics.fact_sales f
      JOIN analytics.dim_campaign c ON c.campaign_key = f.campaign_key
      GROUP BY c.campaign_name
      ORDER BY SUM(f.revenue) DESC
    `);

    return result.rows.map((row) => this.toSeriesPoint(row));
  }

  private toSeriesPoint(row: SeriesRow) {
    return {
      label: row.label,
      value: Number(row.value),
      orders: Number(row.orders ?? 0),
    };
  }
}
