type ApiErrorShape = {
  message?: string;
  errors?: Record<string, string>;
};

export function formatApiErrorMessage(
  response: ApiErrorShape,
  fallback: string
): string {
  const message = response.message?.trim();
  if (message) {
    return message;
  }

  const fieldErrors = response.errors
    ? Object.values(response.errors).map((value) => value.trim()).filter(Boolean)
    : [];

  if (fieldErrors.length > 0) {
    return fieldErrors.join(" ");
  }

  return fallback;
}
