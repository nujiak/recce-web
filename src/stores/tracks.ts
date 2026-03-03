import { createSignal, createMemo, batch } from 'solid-js';
import { db } from '@/db/db';
import type { Track } from '@/types';

const [tracks, setTracks] = createSignal<Track[]>([]);
const [loading, setLoading] = createSignal(true);

db.tracks.toArray().then((data) => {
  batch(() => {
    setTracks(data);
    setLoading(false);
  });
});

export const tracksStore = {
  list: tracks,
  loading,

  async add(track: Omit<Track, 'id' | 'createdAt'>): Promise<Track> {
    const newTrack: Track = {
      ...track,
      id: await db.tracks.add(track as Track),
      createdAt: Date.now(),
    };
    setTracks((t) => [...t, newTrack]);
    return newTrack;
  },

  async update(id: number, updates: Partial<Track>): Promise<void> {
    await db.tracks.update(id, updates);
    setTracks((t) => t.map((track) => (track.id === id ? { ...track, ...updates } : track)));
  },

  async delete(id: number): Promise<void> {
    await db.tracks.delete(id);
    setTracks((t) => t.filter((track) => track.id !== id));
  },

  byId: (id: number) => createMemo(() => tracks().find((t) => t.id === id)),
};
