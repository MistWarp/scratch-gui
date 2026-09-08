// MistWarp targets browsers with the standard Encoding API. Scratch VM keeps
// a legacy `text-encoding` fallback, but bundlers cannot remove its conditional
// CommonJS require and otherwise include more than 600 KB of polyfill tables.
const TextEncoder = window.TextEncoder;
const TextDecoder = window.TextDecoder;

export {TextEncoder, TextDecoder};
