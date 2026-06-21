import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  { level: "info" },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,req,res,responseTime",
          messageFormat: "{msg}",
          singleLine: true,
          levelFirst: false,
        },
      })
    : pino.destination(1)
);
