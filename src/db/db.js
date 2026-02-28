import Dexie from 'dexie';

const db = new Dexie('RecceDatabase');

db.version(2).stores({
  pins: '++id, createdAt, name, lat, lng, color, group, description',
  tracks: '++id, createdAt, name, isCyclical, color, group, description',
});

export async function getAllPins() {
  return db.pins.toArray();
}

export async function addPin(pin) {
  return db.pins.add(pin);
}

export async function updatePin(id, changes) {
  return db.pins.update(id, changes);
}

export async function deletePin(id) {
  return db.pins.delete(id);
}

// Track CRUD operations
export async function getAllTracks() {
  return db.tracks.toArray();
}

export async function addTrack(track) {
  return db.tracks.add(track);
}

export async function updateTrack(id, changes) {
  return db.tracks.update(id, changes);
}

export async function deleteTrack(id) {
  return db.tracks.delete(id);
}

// Get all unique groups from both pins and tracks
export async function getAllGroups() {
  const [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);
  const groups = new Set();

  pins.forEach((p) => {
    if (p.group) groups.add(p.group);
  });

  tracks.forEach((t) => {
    if (t.group) groups.add(t.group);
  });

  return Array.from(groups).sort();
}

export { db };
