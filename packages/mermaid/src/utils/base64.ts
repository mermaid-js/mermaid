export function toBase64(str: string) {
  // ref: https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
  const utf8Bytes = new TextEncoder().encode(str);
  const utf8Str = Array.from(utf8Bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(utf8Str);
}
