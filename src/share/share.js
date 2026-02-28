import pako from 'pako';

// Base62 alphabet: 0-9, A-Z, a-z (62 characters)
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VERSION_PREFIX = 'R1';

/**
 * Encode a Uint8Array to Base62 string
 */
function encodeBase62(bytes) {
  if (bytes.length === 0) return '0';

  // Convert bytes to a big integer
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }

  // Convert to Base62
  let result = '';
  while (num > 0n) {
    const remainder = num % BigInt(62);
    result = BASE62_ALPHABET[Number(remainder)] + result;
    num = num / BigInt(62);
  }

  return result || '0';
}

/**
 * Decode a Base62 string to Uint8Array
 */
function decodeBase62(str) {
  if (!str || str === '0') return new Uint8Array(0);

  // Convert Base62 to big integer
  let num = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BASE62_ALPHABET.indexOf(char);
    if (value === -1) return null; // Invalid character
    num = num * BigInt(62) + BigInt(value);
  }

  // Convert to bytes
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  return new Uint8Array(bytes);
}

/**
 * Encode pins and tracks to a share code
 * @param {Array} pins - Array of pin objects
 * @param {Array} tracks - Array of track objects
 * @returns {string} Share code with R1 prefix
 */
export function encode(pins, tracks) {
  // Build payload with only essential fields
  const payload = {
    pins: (pins || []).map((p) => ({
      createdAt: p.createdAt,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      color: p.color,
      group: p.group || '',
      description: p.description || '',
    })),
    tracks: (tracks || []).map((t) => ({
      createdAt: t.createdAt,
      name: t.name,
      nodes: t.nodes,
      isCyclical: t.isCyclical,
      color: t.color,
      group: t.group || '',
      description: t.description || '',
    })),
  };

  // JSON stringify
  const jsonStr = JSON.stringify(payload);

  // Deflate with pako (raw deflate, no zlib header)
  const compressed = pako.deflate(new TextEncoder().encode(jsonStr), { raw: true });

  // Encode to Base62
  const base62 = encodeBase62(compressed);

  // Prepend version prefix
  return VERSION_PREFIX + base62;
}

/**
 * Decode a share code to pins and tracks
 * @param {string} code - Share code with R1 prefix
 * @returns {{ pins: Array, tracks: Array } | null} Decoded data or null on error
 */
export function decode(code) {
  try {
    // Check version prefix
    if (!code || !code.startsWith(VERSION_PREFIX)) {
      return null;
    }

    // Strip prefix
    const base62 = code.slice(VERSION_PREFIX.length);

    // Decode from Base62
    const compressed = decodeBase62(base62);
    if (!compressed) return null;

    // Inflate with pako
    const decompressed = pako.inflate(compressed, { raw: true });

    // Parse JSON
    const jsonStr = new TextDecoder().decode(decompressed);
    const payload = JSON.parse(jsonStr);

    // Validate structure
    if (!payload || typeof payload !== 'object') return null;
    if (!Array.isArray(payload.pins)) payload.pins = [];
    if (!Array.isArray(payload.tracks)) payload.tracks = [];

    return {
      pins: payload.pins,
      tracks: payload.tracks,
    };
  } catch (e) {
    console.error('Share code decode error:', e);
    return null;
  }
}
