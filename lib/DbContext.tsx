import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { webDb } from './webDb';

type SimpleDB = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (query: string, params: any[]) => Promise<void>;
  getAllAsync: <T>(query: string) => Promise<T[]>;
};

const DbContext = createContext<SimpleDB | null>(null);

export function useDb(): SimpleDB {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useSQLiteContext } = require('expo-sqlite');
    return useSQLiteContext();
  }
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb must be inside DbProvider');
  return ctx;
}

export function WebDbProvider({ children }: { children: React.ReactNode }) {
  return <DbContext.Provider value={webDb}>{children}</DbContext.Provider>;
}
