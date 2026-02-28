import maplibregl from 'maplibre-gl';

const markers = new Map();

export function renderMarkers(map, pins) {
  for (const pin of pins) {
    addMarker(map, pin);
  }
}

export function addMarker(map, pin) {
  const marker = new maplibregl.Marker().setLngLat([pin.lng, pin.lat]).addTo(map);

  marker.getElement().addEventListener('click', () => {
    map.flyTo({ center: [pin.lng, pin.lat] });
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
