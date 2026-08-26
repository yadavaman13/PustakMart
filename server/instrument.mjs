//config for the error handling

import * as Sentry from "@sentry/node";
import envConfig from "./src/config/env.config.js";

Sentry.init({
  dsn: envConfig.SENTRY_DSN,
  environment: envConfig.NODE_ENV || "development",
});