function normalizeUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim();
  if (!raw) {
    return fallback;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return `http://${raw}`;
}

export const INTERNAL_API_URL = normalizeUrl(
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:4000",
);
