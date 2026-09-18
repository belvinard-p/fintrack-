interface FastApiValidationError {
  type?: string;
  loc?: (string | number)[];
  msg: string;
  input?: unknown;
}

function isValidationErrorArray(detail: unknown): detail is FastApiValidationError[] {
  return (
    Array.isArray(detail) &&
    detail.length > 0 &&
    detail.every((item) => item && typeof item === "object" && typeof item.msg === "string")
  );
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (isValidationErrorArray(detail)) {
    return detail.map((item) => item.msg.replace(/^Value error,\s*/, "")).join(" ");
  }

  return fallback;
}
