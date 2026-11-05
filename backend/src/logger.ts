type Level = "info" | "warn" | "error";

const write = (level: Level, message: string, ...details: unknown[]) => {
  console[level](`${new Date().toISOString()} [${level}] ${message}`, ...details);
};

export const logger = {
  info: (message: string, ...details: unknown[]) => write("info", message, ...details),
  warn: (message: string, ...details: unknown[]) => write("warn", message, ...details),
  error: (message: string, ...details: unknown[]) => write("error", message, ...details),
};
