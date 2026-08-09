import * as Sentry from "@sentry/node";
import envConfig from "./src/config/envConfig.js";

Sentry.init({
  dsn: envConfig.SENTRY_DSN,
  environment: envConfig.NODE_ENV || "development",
});