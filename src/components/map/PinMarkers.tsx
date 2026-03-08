import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { useUI } from '../../context/UIContext';
import type { Pin, PinColor } from '../../types';

const SRC_PINS = 'pm-pins';
const LAYER_PINS = 'pl-pins';
const PIN_LAYER_SLOT = 'airport';
const PIN_IMAGE_PREFIX = 'pin-marker';
const PIN_SIZE = 24;

const PIN_FILL: Record<PinColor, string> = {
  red: '#f53d3d',
  orange: '#f5993d',
  green: '#66cc66',
  azure: '#4799eb',
  violet: '#a64dff',
};

interface PinMarkersProps {
  map: maplibregl.Map;
  pins: Pin[];
}

type PinProperties = {
  id: number;
  name: string;
  icon: string;
};

function createPinSvg(color: PinColor) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12.7 12.7" width="${PIN_SIZE}" height="${PIN_SIZE}">
      <path fill="#ffffff" d="M 6.35,0 C 4.2604116,0 2.5662517,1.6936438 2.5662517,3.7832315 2.5662517,7.200815 6.35,7.5670684 6.35,12.7 6.35,7.5670684 10.133748,7.200815 10.133748,3.7832315 10.133748,1.6936438 8.4395884,0 6.35,0 Z"/>
      <path fill="${PIN_FILL[color]}" d="M 6.1762216,0.53433429 C 4.85621,0.58444269 3.6363327,1.5304053 3.2485337,2.7912348 2.9241787,3.7988173 3.1217168,4.938496 3.7231116,5.803679 4.407899,6.8134581 5.3150161,7.6626653 5.9048607,8.7393771 6.0731891,9.038578 6.2255841,9.3474547 6.3488209,9.6681437 6.7834816,8.5191139 7.5722929,7.5593137 8.3529312,6.6294203 8.952872,5.9176332 9.5174786,5.0970261 9.5864504,4.139806 9.7199626,2.9774255 9.1747831,1.7700118 8.2059295,1.1114771 7.6183365,0.69878056 6.8927098,0.49515736 6.1762216,0.53433429 Z"/>
      <circle cx="6.35" cy="4.0340993" r="0.90117738" fill="rgba(0,0,0,0.25)"/>
      <path fill="rgba(0,0,0,0.25)" d="M 4.4645653,6.7758206 C 4.9794041,7.4055341 5.5116444,8.0225811 5.9048605,8.7393768 6.073189,9.0385783 6.225584,9.3474544 6.3488208,9.6681436 6.7596811,8.5819724 7.4875098,7.6667146 8.225227,6.7844313 7.6208538,7.5349591 6.8619319,8.311395 6.3488208,9.6681436 6.225584,9.3474544 6.073189,9.0385783 5.9048605,8.7393768 5.5371573,8.0689015 5.0419793,7.4831814 4.4645653,6.7758206 Z"/>
    </svg>
  `.trim();
}

async function rasterizeSvg(svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.width = PIN_SIZE;
      img.height = PIN_SIZE;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load pin SVG image'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = PIN_SIZE;
    canvas.height = PIN_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create pin canvas context');
    context.drawImage(image, 0, 0, PIN_SIZE, PIN_SIZE);

    const imageData = context.getImageData(0, 0, PIN_SIZE, PIN_SIZE);
    return {
      width: PIN_SIZE,
      height: PIN_SIZE,
      data: imageData.data,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function ensurePinImages(map: maplibregl.Map) {
  await Promise.all(
    (Object.keys(PIN_FILL) as PinColor[]).map(async (color) => {
      const imageId = `${PIN_IMAGE_PREFIX}-${color}`;
      if (map.hasImage(imageId)) return;
      const image = await rasterizeSvg(createPinSvg(color));
      if (!map.hasImage(imageId)) {
        map.addImage(imageId, image, { pixelRatio: 1 });
      }
    })
  );
}

function pinsToGeoJSON(pins: Pin[]): GeoJSON.FeatureCollection<GeoJSON.Point, PinProperties> {
  return {
    type: 'FeatureCollection',
    features: pins.map((pin) => ({
      type: 'Feature',
      properties: {
        id: pin.id,
        name: pin.name,
        icon: `${PIN_IMAGE_PREFIX}-${pin.color}`,
      },
      geometry: {
        type: 'Point',
        coordinates: [pin.lng, pin.lat],
      },
    })),
  };
}

const PinMarkers: Component<PinMarkersProps> = (props) => {
  const { setViewingPin } = useUI();
  let handlersBound = false;
  let layersReady = false;

  const handlePinClick = (event: maplibregl.MapLayerMouseEvent) => {
    const id = Number(event.features?.[0]?.properties?.id);
    const pin = props.pins.find((item) => item.id === id);
    if (pin) setViewingPin(pin);
  };

  const handlePointerEnter = () => {
    props.map.getCanvas().style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    props.map.getCanvas().style.cursor = '';
  };

  function bindLayerEvents() {
    if (handlersBound || !props.map.getLayer(LAYER_PINS)) return;
    props.map.on('click', LAYER_PINS, handlePinClick);
    props.map.on('mouseenter', LAYER_PINS, handlePointerEnter);
    props.map.on('mouseleave', LAYER_PINS, handlePointerLeave);
    handlersBound = true;
  }

  function unbindLayerEvents() {
    if (!handlersBound) return;
    props.map.off('click', LAYER_PINS, handlePinClick);
    props.map.off('mouseenter', LAYER_PINS, handlePointerEnter);
    props.map.off('mouseleave', LAYER_PINS, handlePointerLeave);
    handlersBound = false;
  }

  async function ensurePinLayers() {
    const map = props.map;
    const beforeId = map.getLayer(PIN_LAYER_SLOT) ? PIN_LAYER_SLOT : undefined;

    await ensurePinImages(map);

    if (!map.getSource(SRC_PINS)) {
      map.addSource(SRC_PINS, {
        type: 'geojson',
        data: pinsToGeoJSON([]),
      });
    }

    if (!map.getLayer(LAYER_PINS)) {
      map.addLayer(
        {
          id: LAYER_PINS,
          type: 'symbol',
          source: SRC_PINS,
          layout: {
            'icon-image': ['get', 'icon'],
            'icon-size': 1,
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        },
        beforeId
      );
    }

    layersReady = true;
  }

  function updatePinData() {
    if (!layersReady) return;
    const source = props.map.getSource(SRC_PINS) as maplibregl.GeoJSONSource | undefined;
    source?.setData(pinsToGeoJSON(props.pins));
  }

  onMount(() => {
    const map = props.map;

    const handleStyleLoad = async () => {
      layersReady = false;
      unbindLayerEvents();
      try {
        await ensurePinLayers();
        updatePinData();
        bindLayerEvents();
      } catch (error) {
        console.error('Failed to initialize pin layers', error);
      }
    };

    void handleStyleLoad();
    map.on('style.load', handleStyleLoad);

    onCleanup(() => {
      map.off('style.load', handleStyleLoad);
      unbindLayerEvents();
    });
  });

  createEffect(() => {
    updatePinData();
  });

  onCleanup(() => {
    const map = props.map;
    layersReady = false;
    unbindLayerEvents();
    if (map.getLayer(LAYER_PINS)) map.removeLayer(LAYER_PINS);
    if (map.getSource(SRC_PINS)) map.removeSource(SRC_PINS);
  });

  return null;
};

export default PinMarkers;
