import pino, { type DestinationStream, type LoggerOptions } from 'pino';

export function createLogger(
  options: LoggerOptions = {},
  destination?: DestinationStream
) {
  return pino(
    {
      level: process.env.LOG_LEVEL || 'info',
      ...options,
    },
    destination
  );
}

const logger = createLogger();

export default logger;
