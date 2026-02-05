export function formatMessage(
  template: string,
  context: Record<string, unknown> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in context)) {
      return match;
    }
    const value = context[key];
    if (value === null || value === undefined) {
      return String(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  });
}
