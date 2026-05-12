import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.WEB_ORIGIN
      ? process.env.WEB_ORIGIN.split(",")
      : process.env.RENDER === "true"
        ? true
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("InsightFlow AI API")
    .setDescription("Phase 1 API scaffold for health and authentication")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(
    Number(process.env.PORT ?? 3001),
    process.env.HOST ?? "127.0.0.1",
  );
}

bootstrap().catch((error: unknown) => {
  console.error("API bootstrap failed", error);
  process.exit(1);
});
