type LogLevel = 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
  }

  return error;
}

function sanitizeMeta(meta: LogMeta): LogMeta {
  const redactedKeys = new Set(['password', 'token', 'secret', 'authorization', 'apiKey', 'api_key']);

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (redactedKeys.has(key)) {
        return [key, '[REDACTED]'];
      }

      if (value instanceof Error) {
        return [key, serializeError(value)];
      }

      return [key, value];
    }),
  );
}

function write(level: LogLevel, message: string, meta?: LogMeta) {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = sanitizeMeta(meta);
  }

  const output = JSON.stringify(payload);

  if (level === 'error') {
    process.stderr.write(`${output}\n`);
    return;
  }

  if (level === 'warn') {
    process.stdout.write(`${output}\n`);
    return;
  }

  process.stdout.write(`${output}\n`);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write('info', message, meta),
  warn: (message: string, meta?: LogMeta) => write('warn', message, meta),
  error: (message: string, error?: unknown, meta?: LogMeta) => {
    const payload = {
      ...(meta || {}),
      error: serializeError(error),
    };

    write('error', message, payload);
  },
};