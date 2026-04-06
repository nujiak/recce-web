import Dexie, { type Table } from 'dexie';
import type { Pin, Track } from '../types';

class RecceDatabase extends Dexie {
  pins!: Table<Pin, number>;
  tracks!: Table<Track, number>;

  constructor() {
    super('RecceDatabase');
    this.version(2).stores({
      pins: '++id, createdAt, name, lat, lng, color, group, description',
      tracks: '++id, createdAt, name, isCyclical, color, group, description',
    });
    this.version(3)
      .stores({
        pins: '++id, createdAt, name, lat, lng, color, markerType, group, description',
        tracks: '++id, createdAt, name, isCyclical, color, group, description',
      })
      .upgrade((tx) => {
        return tx
          .table('pins')
          .toCollection()
          .modify((pin) => {
            if (!pin.markerType) pin.markerType = 'pin';
            if (pin.bearing == null) pin.bearing = 0;
          });
      });
  }
}

const db = new RecceDatabase();

export async function getAllPins(): Promise<Pin[]> {
  return db.pins.toArray();
}

export async function addPin(pin: Omit<Pin, 'id'>): Promise<number> {
  return db.pins.add(pin as Pin);
}

export async function updatePin(id: number, changes: Partial<Pin>): Promise<number> {
  return db.pins.update(id, changes);
}

export async function deletePin(id: number): Promise<void> {
  return db.pins.delete(id);
}

export async function getAllTracks(): Promise<Track[]> {
  return db.tracks.toArray();
}

export async function addTrack(track: Omit<Track, 'id'>): Promise<number> {
  return db.tracks.add(track as Track);
}

export async function updateTrack(id: number, changes: Partial<Track>): Promise<number> {
  return db.tracks.update(id, changes);
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
