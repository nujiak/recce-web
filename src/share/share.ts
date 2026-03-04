import pako from 'pako';
import type { Pin, Track } from '../types';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VERSION_PREFIX = 'R1';

interface SharePayload {
  pins: Array<{
    createdAt: number;
    name: string;
    lat: number;
    lng: number;
    color: string;
    group: string;
    description: string;
  }>;
  tracks: Array<{
    createdAt: number;
    name: string;
    nodes: Array<{ lat: number; lng: number; name?: string }>;
    isCyclical: boolean;
    color: string;
    group: string;
    description: string;
  }>;
}

interface DecodeResult {
  pins: Pin[];
  tracks: Track[];
}

function encodeBase62(bytes: Uint8Array): string {
  if (bytes.length === 0) return '0';

  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }

  let result = '';
  while (num > 0n) {
    const remainder = num % BigInt(62);
    result = BASE62_ALPHABET[Number(remainder)] + result;
    num = num / BigInt(62);
  }

  return result || '0';
}

function decodeBase62(str: string): Uint8Array | null {
  if (!str || str === '0') return new Uint8Array(0);

  let num = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BASE62_ALPHABET.indexOf(char);
    if (value === -1) return null;
    num = num * BigInt(62) + BigInt(value);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  return new Uint8Array(bytes);
}

export function encode(pins: Pin[], tracks: Track[]): string {
  const payload: SharePayload = {
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

  const jsonStr = JSON.stringify(payload);
  const compressed = pako.deflate(new TextEncoder().encode(jsonStr), { raw: true });
  const base62 = encodeBase62(compressed);

  return VERSION_PREFIX + base62;
}

export function decode(code: string): DecodeResult | null {
  try {
    if (!code || !code.startsWith(VERSION_PREFIX)) {
      return null;
    }

    const base62 = code.slice(VERSION_PREFIX.length);
    const compressed = decodeBase62(base62);
    if (!compressed) return null;

    const decompressed = pako.inflate(compressed, { raw: true });
    const jsonStr = new TextDecoder().decode(decompressed);
    const payload = JSON.parse(jsonStr) as SharePayload;

    if (!payload || typeof payload !== 'object') return null;
    if (!Array.isArray(payload.pins)) payload.pins = [];
    if (!Array.isArray(payload.tracks)) payload.tracks = [];

    return {
      pins: payload.pins as Pin[],
      tracks: payload.tracks as Track[],
    };
  } catch (e) {
    console.error('Share code decode error:', e);
    return null;
  }
}
