export function uuid(): string {
  const cryptoApi = globalThis.crypto;
  const randomUUID = cryptoApi?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(cryptoApi);
  }
  if (!cryptoApi) {
    throw new Error('Crypto API is unavailable.');
  }
  const getRandomValues = cryptoApi.getRandomValues?.bind(cryptoApi);
  if (typeof getRandomValues !== 'function') {
    throw new Error('Crypto.getRandomValues is unavailable.');
  }

  const bytes = new Uint8Array(16);
  getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
