import pino from "pino";
import { env } from "../../config/env";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "info" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname,req,res,responseTime,port,env,ms",
        messageFormat: "{msg}",
        singleLine: true,
      },
    },
  }),
});
