import { createSignal, createMemo, batch } from 'solid-js';
import { db } from '@/db/db';
import type { Pin } from '@/types';

const [pins, setPins] = createSignal<Pin[]>([]);
const [loading, setLoading] = createSignal(true);

db.pins.toArray().then((data) => {
  batch(() => {
    setPins(data);
    setLoading(false);
  });
});

export const pinsStore = {
  list: pins,
  loading,

  async add(pin: Omit<Pin, 'id' | 'createdAt'>): Promise<Pin> {
    const newPin: Pin = {
      ...pin,
      id: await db.pins.add(pin as Pin),
      createdAt: Date.now(),
    };
    setPins((p) => [...p, newPin]);
    return newPin;
  },

  async update(id: number, updates: Partial<Pin>): Promise<void> {
    await db.pins.update(id, updates);
    setPins((p) => p.map((pin) => (pin.id === id ? { ...pin, ...updates } : pin)));
  },

  async delete(id: number): Promise<void> {
    await db.pins.delete(id);
    setPins((p) => p.filter((pin) => pin.id !== id));
  },

  async deleteMany(ids: number[]): Promise<void> {
    await db.pins.bulkDelete(ids);
    setPins((p) => p.filter((pin) => !ids.includes(pin.id)));
  },

  byId: (id: number) => createMemo(() => pins().find((p) => p.id === id)),
  byGroup: (group: string) => createMemo(() => pins().filter((p) => p.group === group)),
};
