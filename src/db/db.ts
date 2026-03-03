import Dexie, { type EntityTable } from 'dexie';
import type { Pin, Track } from '@/types';

const db = new Dexie('RecceDatabase') as Dexie & {
  pins: EntityTable<Pin, 'id'>;
  tracks: EntityTable<Track, 'id'>;
};

db.version(2).stores({
  pins: '++id, createdAt, name, lat, lng, color, group, description',
  tracks: '++id, createdAt, name, isCyclical, color, group, description',
});

export async function getAllPins(): Promise<Pin[]> {
  return db.pins.toArray();
}

export async function addPin(pin: Omit<Pin, 'id' | 'createdAt'>): Promise<number> {
  const fullPin = {
    ...pin,
    createdAt: Date.now(),
  };
  return db.pins.add(fullPin as Pin);
}

export async function updatePin(id: number, changes: Partial<Pin>): Promise<number> {
  return db.pins.update(id, changes) as Promise<number>;
}

export async function deletePin(id: number): Promise<void> {
  return db.pins.delete(id);
}

export async function getAllTracks(): Promise<Track[]> {
  return db.tracks.toArray();
}

export async function addTrack(track: Omit<Track, 'id' | 'createdAt'>): Promise<number> {
  const fullTrack = {
    ...track,
    createdAt: Date.now(),
  };
  return db.tracks.add(fullTrack as Track);
}

export async function updateTrack(id: number, changes: Partial<Track>): Promise<number> {
  return db.tracks.update(id, changes) as Promise<number>;
}

export async function deleteTrack(id: number): Promise<void> {
  return db.tracks.delete(id);
}

export async function getAllGroups(): Promise<string[]> {
  const [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);
  const groups = new Set<string>();

  pins.forEach((p) => {
    if (p.group) groups.add(p.group);
  });

  tracks.forEach((t) => {
    if (t.group) groups.add(t.group);
  });

  return Array.from(groups).sort();
}

export { db };
