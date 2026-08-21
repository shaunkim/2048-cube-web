import type { KeyValueStore } from './gameStorage';

export const platformStore: KeyValueStore = {
  getItem: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key, value) => {
    globalThis.localStorage?.setItem(key, value);
  },
};
