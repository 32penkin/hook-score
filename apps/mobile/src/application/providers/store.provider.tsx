import { createContext, PropsWithChildren, useContext, useRef } from 'react';

import { RootStore } from '../root.store';

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RootStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RootStore();
  }

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useRootStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useRootStore must be used inside StoreProvider');
  }

  return store;
}
