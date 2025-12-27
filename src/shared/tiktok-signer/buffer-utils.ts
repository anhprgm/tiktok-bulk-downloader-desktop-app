/**
 * Buffer utilities for browser compatibility
 * Replaces Node.js Buffer with Uint8Array and DataView
 */

// Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert string to Uint8Array (UTF-8)
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string (UTF-8)
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// Convert string to Uint8Array (ASCII)
export function asciiToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

// Allocate a new Uint8Array with zeros
export function allocBytes(size: number): Uint8Array {
  return new Uint8Array(size);
}

// Read BigUInt64 Little Endian from Uint8Array
export function readBigUInt64LE(bytes: Uint8Array, offset: number = 0): bigint {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getBigUint64(offset, true);
}

// Write BigUInt64 Little Endian to Uint8Array
export function writeBigUInt64LE(
  bytes: Uint8Array,
  value: bigint,
  offset: number = 0
): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setBigUint64(offset, value, true);
}

// Concatenate multiple Uint8Arrays
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Copy bytes from src to dst
export function copyBytes(
  src: Uint8Array,
  dst: Uint8Array,
  dstOffset: number = 0,
  srcStart: number = 0,
  srcEnd?: number
): void {
  const slice = src.subarray(srcStart, srcEnd);
  dst.set(slice, dstOffset);
}

// Fill Uint8Array with a value
export function fillBytes(
  bytes: Uint8Array,
  value: number,
  start: number = 0,
  end?: number
): void {
  bytes.fill(value, start, end);
}

// Convert Uint8Array to Base64
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random bytes (browser-compatible)
export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}
