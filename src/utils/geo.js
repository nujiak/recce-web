// Earth radius in metres
const EARTH_RADIUS = 6371000;

/**
 * Calculate the Haversine distance between two points in metres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Calculate the total distance of a track in metres
 */
export function calculateTotalDistance(nodes, isCyclical) {
  if (!nodes || nodes.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    total += haversineDistance(nodes[i].lat, nodes[i].lng, nodes[i + 1].lat, nodes[i + 1].lng);
  }

  // Add closing segment for cyclical tracks
  if (isCyclical && nodes.length >= 3) {
    total += haversineDistance(
      nodes[nodes.length - 1].lat,
      nodes[nodes.length - 1].lng,
      nodes[0].lat,
      nodes[0].lng
    );
  }

  return total;
}

/**
 * Calculate the enclosed area of a polygon in square metres
 * Using the spherical excess formula (Girard's theorem)
 */
export function calculateArea(nodes) {
  if (!nodes || nodes.length < 3) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const n = nodes.length;

  // Calculate spherical excess using the formula for a spherical polygon
  let excess = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const k = (i + 2) % n;

    const lat1 = toRad(nodes[i].lat);
    const lat2 = toRad(nodes[j].lat);
    const lat3 = toRad(nodes[k].lat);

    const lng1 = toRad(nodes[i].lng);
    const lng2 = toRad(nodes[j].lng);
    const lng3 = toRad(nodes[k].lng);

    // Calculate the angle at vertex j
    const theta =
      Math.atan2(
        Math.sin(lng3 - lng2) * Math.cos(lat3) -
          Math.sin(lat3 - lat2) * Math.cos(lat3) * Math.sin(lng2 - lng1),
        Math.cos(lat2) * Math.sin(lat3 - lat2) +
          Math.sin(lat2) * Math.cos(lat3) * Math.cos(lng3 - lng2) -
          Math.cos(lat2) * Math.cos(lat3) * Math.cos(lng2 - lng1)
      ) -
      Math.atan2(Math.sin(lng2 - lng1) * Math.cos(lat1), Math.cos(lat2) * Math.sin(lat1 - lat2));

    excess += theta;
  }

  // Area = R^2 * |E| where E is the spherical excess
  return Math.abs(EARTH_RADIUS * EARTH_RADIUS * excess);
}

/**
 * Calculate the initial bearing from point 1 to point 2 in degrees
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const x = Math.sin(dLng) * Math.cos(lat2Rad);
  const y =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = toDeg(Math.atan2(x, y));
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Format distance in the user's preferred unit
 */
export function formatDistance(metres, lengthUnit) {
  switch (lengthUnit) {
    case 'imperial': {
      const feet = metres * 3.28084;
      if (feet < 5280) {
        return `${Math.round(feet)} ft`;
      }
      const miles = feet / 5280;
      return `${miles.toFixed(2)} mi`;
    }
    case 'nautical': {
      const nm = metres / 1852;
      return `${nm.toFixed(2)} NM`;
    }
    case 'metric':
    default: {
      if (metres < 1000) {
        return `${Math.round(metres)} m`;
      }
      const km = metres / 1000;
      return `${km.toFixed(2)} km`;
    }
  }
}

/**
 * Format area in the user's preferred unit
 */
export function formatArea(sqMetres, lengthUnit) {
  switch (lengthUnit) {
    case 'imperial': {
      const sqFeet = sqMetres * 10.7639;
      if (sqFeet < 27878400) {
        // Less than 1 sq mile
        return `${sqFeet.toFixed(0)} sq ft`;
      }
      const sqMiles = sqFeet / 27878400;
      return `${sqMiles.toFixed(3)} sq mi`;
    }
    case 'nautical': {
      const sqNm = sqMetres / 3429904; // 1 NM = 1852 m, so 1 sq NM = 1852^2 sq m
      return `${sqNm.toFixed(3)} sq NM`;
    }
    case 'metric':
    default: {
      if (sqMetres < 1000000) {
        return `${sqMetres.toFixed(0)} m²`;
      }
      const sqKm = sqMetres / 1000000;
      return `${sqKm.toFixed(3)} km²`;
    }
  }
}

/**
 * Format bearing in the user's preferred unit
 */
export function formatBearing(degrees, angleUnit) {
  if (angleUnit === 'mils') {
    const mils = Math.round((degrees * 6400) / 360);
    return `${mils} mils`;
  }
  return `${Math.round(degrees)}°`;
}

/**
 * Get the bounds of a track
 * Returns [[minLng, minLat], [maxLng, maxLat]]
 */
export function getTrackBounds(nodes) {
  if (!nodes || nodes.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const node of nodes) {
    minLat = Math.min(minLat, node.lat);
    maxLat = Math.max(maxLat, node.lat);
    minLng = Math.min(minLng, node.lng);
    maxLng = Math.max(maxLng, node.lng);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
