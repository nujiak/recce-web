import Dexie from 'dexie';

const db = new Dexie('RecceDatabase');

db.version(1).stores({
  pins: '++id, createdAt, name, lat, lng, color, group, description',
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

export { db };
