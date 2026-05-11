import { Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("refresh")
  @ApiOperation({ summary: "Refresh analytics star schema from staging tables" })
  refresh() {
    return this.analyticsService.refresh();
  }

  @Get("overview")
  @ApiOperation({ summary: "Return dashboard KPI totals" })
  overview() {
    return this.analyticsService.overview();
  }

  @Get("revenue/daily")
  @ApiOperation({ summary: "Return revenue by order date" })
  revenueByDay() {
    return this.analyticsService.revenueByDay();
  }

  @Get("revenue/products")
  @ApiOperation({ summary: "Return revenue by product" })
  revenueByProduct() {
    return this.analyticsService.revenueByProduct();
  }

  @Get("revenue/regions")
  @ApiOperation({ summary: "Return revenue by region" })
  revenueByRegion() {
    return this.analyticsService.revenueByRegion();
  }

  @Get("revenue/campaigns")
  @ApiOperation({ summary: "Return revenue by campaign" })
  revenueByCampaign() {
    return this.analyticsService.revenueByCampaign();
  }
}
