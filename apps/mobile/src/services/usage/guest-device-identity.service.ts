import { Platform } from 'react-native';

import { secureStoreStorage } from '../auth/secure-store.storage';

const GUEST_DEVICE_ID_STORAGE_KEY = 'hook-score-guest-device-id';

type RandomUuidCrypto = {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getGlobalCrypto = () =>
  (globalThis as { crypto?: RandomUuidCrypto }).crypto;

const getWebStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getRandomBytes = () => {
  const bytes = new Uint8Array(16);
  const crypto = getGlobalCrypto();

  if (crypto?.getRandomValues) {
    return crypto.getRandomValues(bytes);
  }

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  return bytes;
};

const createUuid = () => {
  const crypto = getGlobalCrypto();

  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = getRandomBytes();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

const isValidUuid = (value: string | null): value is string =>
  Boolean(value && UUID_REGEX.test(value));

export class GuestDeviceIdentityService {
  private deviceIdPromise: Promise<string> | null = null;

  getDeviceId() {
    if (!this.deviceIdPromise) {
      this.deviceIdPromise = this.resolveDeviceId();
    }

    return this.deviceIdPromise;
  }

  private async resolveDeviceId() {
    const storedDeviceId = await this.getStoredDeviceId();

    if (isValidUuid(storedDeviceId)) {
      return storedDeviceId;
    }

    const deviceId = createUuid();
    await this.setStoredDeviceId(deviceId);

    return deviceId;
  }

  private async getStoredDeviceId() {
    if (Platform.OS === 'web') {
      return getWebStorage()?.getItem(GUEST_DEVICE_ID_STORAGE_KEY) ?? null;
    }

    return secureStoreStorage.getItem(GUEST_DEVICE_ID_STORAGE_KEY);
  }

  private async setStoredDeviceId(deviceId: string) {
    if (Platform.OS === 'web') {
      getWebStorage()?.setItem(GUEST_DEVICE_ID_STORAGE_KEY, deviceId);
      return;
    }

    await secureStoreStorage.setItem(GUEST_DEVICE_ID_STORAGE_KEY, deviceId);
  }
}
