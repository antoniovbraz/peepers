import pino, { type LoggerOptions, type DestinationStream, type Logger } from 'pino';

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

export function createLogger(dest?: DestinationStream): Logger {
  return pino(options, dest);
}

export const logger = createLogger();

export default logger;
