export function decodeBase64url(str: string) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function decodeBase64urlToBuffer(base64url: string) {
  // Gmail uses base64url (different from standard base64)
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}
