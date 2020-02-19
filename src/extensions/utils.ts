export function hash(value: string, length = 16): string {
  if (value.length === 0 || length <= 0) { return ''; }
  const createChunk = (chunkValue: string) => {
    let hval = 0x811c9dc5;

    for (let i = 0, l = chunkValue.length; i < l; i++) {
      hval ^= chunkValue.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    // Convert to 8 digit hex string
    return (hval >>> 0).toString(36);
  };
  let result = createChunk(value);
  while (result.length < length) result += createChunk(result + value);
  return result.substr(0, length);
}