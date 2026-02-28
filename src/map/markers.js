import maplibregl from 'maplibre-gl';

const markers = new Map();

const COLOR_MARKERS = {
  red: '#e53935',
  orange: '#fb8c00',
  green: '#43a047',
  azure: '#1e88e5',
  violet: '#8e24aa',
};

export function renderMarkers(map, pins) {
  for (const pin of pins) {
    addMarker(map, pin);
  }
}

export function addMarker(map, pin) {
  const color = COLOR_MARKERS[pin.color] || COLOR_MARKERS.red;

  const el = document.createElement('div');
  el.className = 'pin-marker';
  el.style.backgroundColor = color;
  el.style.width = '24px';
  el.style.height = '24px';
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  el.style.cursor = 'pointer';

  const marker = new maplibregl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(map);

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('pinClicked', { detail: { pin } }));
  });

  markers.set(pin.id, marker);
}

export function removeMarker(pinId) {
  const marker = markers.get(pinId);
  if (marker) {
    marker.remove();
    markers.delete(pinId);
  }
}

export function updateMarker(map, pin) {
  removeMarker(pin.id);
  addMarker(map, pin);
}

export function clearAllMarkers() {
  markers.forEach((marker) => marker.remove());
  markers.clear();
}
