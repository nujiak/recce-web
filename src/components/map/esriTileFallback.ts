import maplibregl from 'maplibre-gl';

const ESRI_PROTOCOL = 'esri-fallback';
const ESRI_TILE_BASE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const FALLBACK_MIN_ZOOM = 0;
const PLACEHOLDER_SAMPLE_POINTS = [
  [0, 0],
  [128, 128],
  [255, 255],
  [64, 192],
] as const;
const KNOWN_PLACEHOLDER_SIGNATURES = [
  [204, 204, 204, 255],
  [237, 237, 237, 255],
] as const;

let protocolRegistered = false;

function buildTileUrl(z: number, x: number, y: number): string {
  return `${ESRI_TILE_BASE_URL}/${z}/${y}/${x}`;
}

async function fetchTile(url: string): Promise<ArrayBuffer | null> {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) return null;

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return null;

  const data = await response.arrayBuffer();
  if (data.byteLength === 0) return null;

  if (await isPlaceholderTile(data, contentType)) return null;

  return data;
}

async function isPlaceholderTile(data: ArrayBuffer, contentType: string): Promise<boolean> {
  if (!contentType.startsWith('image/')) return true;

  try {
    const blob = new Blob([data], { type: contentType });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;

    context.drawImage(bitmap, 0, 0);
    const samples = PLACEHOLDER_SAMPLE_POINTS.map(([x, y]) =>
      Array.from(context.getImageData(x, y, 1, 1).data)
    );

    return samples.every((sample) =>
      KNOWN_PLACEHOLDER_SIGNATURES.some((signature) => matchesSignature(sample, signature))
    );
  } catch {
    return false;
  }
}

function matchesSignature(sample: number[], signature: readonly number[]): boolean {
  return signature.every((value, index) => Math.abs(sample[index] - value) <= 2);
}

async function fetchTileWithFallback(z: number, x: number, y: number): Promise<ArrayBuffer> {
  for (let zoom = z; zoom >= FALLBACK_MIN_ZOOM; zoom -= 1) {
    const scale = 2 ** (z - zoom);
    const fallbackX = Math.floor(x / scale);
    const fallbackY = Math.floor(y / scale);
    const tile = await fetchTile(buildTileUrl(zoom, fallbackX, fallbackY));
    if (tile) return tile;
  }

  throw new Error(`Unable to load ESRI imagery tile for z${z}/${x}/${y}`);
}

function parseTileUrl(params: string): { z: number; x: number; y: number } {
  const match = params.match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid ESRI fallback tile URL: ${params}`);
  }

  return {
    z: Number(match[1]),
    x: Number(match[2]),
    y: Number(match[3]),
  };
}

export function ensureEsriTileFallbackProtocol() {
  if (protocolRegistered) return;

  maplibregl.addProtocol(ESRI_PROTOCOL, async (request) => {
    const { z, x, y } = parseTileUrl(request.url.replace(`${ESRI_PROTOCOL}://`, ''));
    const data = await fetchTileWithFallback(z, x, y);
    return { data };
  });

  protocolRegistered = true;
}

export function getEsriFallbackTileTemplate() {
  ensureEsriTileFallbackProtocol();
  return `${ESRI_PROTOCOL}://{z}/{x}/{y}`;
}
