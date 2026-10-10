// Registers jest-dom matchers (toBeInTheDocument, toHaveClass, ...) at runtime
// and, because this file is inside src/, makes their types visible to tsc.
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom does not provide TextEncoder/TextDecoder, which @stellar/stellar-sdk
// needs. Browsers and Node both have them, so this only affects tests.
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
