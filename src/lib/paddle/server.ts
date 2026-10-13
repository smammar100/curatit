import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk";
import { getPaddleConfig } from "./config";

// Import only from server routes/scripts. Never re-export through a client module.
export function createPaddle() {
  return new Paddle(getPaddleConfig().apiKey, {
    environment: Environment.sandbox,
    logLevel: LogLevel.error,
  });
}
