import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const META_PREFIX = 'hook-score-secure-store-chunks:';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const getChunkKey = (key: string, index: number) => `${key}.chunk.${index}`;

const parseChunkCount = (metadata: string | null) => {
  if (!metadata?.startsWith(META_PREFIX)) {
    return null;
  }

  const chunkCount = Number(metadata.slice(META_PREFIX.length));

  return Number.isInteger(chunkCount) && chunkCount > 0 ? chunkCount : null;
};

const removeSecureStoreItem = async (key: string) => {
  const storedValue = await SecureStore.getItemAsync(key, secureStoreOptions);
  const chunkCount = parseChunkCount(storedValue);

  if (chunkCount) {
    await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(getChunkKey(key, index), secureStoreOptions)
      )
    );
  }

  await SecureStore.deleteItemAsync(key, secureStoreOptions);
};

export const secureStoreStorage = {
  async getItem(key: string) {
    const storedValue = await SecureStore.getItemAsync(key, secureStoreOptions);
    const chunkCount = parseChunkCount(storedValue);

    if (!chunkCount) {
      return storedValue;
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(getChunkKey(key, index), secureStoreOptions)
      )
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string) {
    await removeSecureStoreItem(key);

    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [''];

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(getChunkKey(key, index), chunk, secureStoreOptions)
      )
    );
    await SecureStore.setItemAsync(`${key}`, `${META_PREFIX}${chunks.length}`, secureStoreOptions);
  },

  async removeItem(key: string) {
    await removeSecureStoreItem(key);
  },
};
