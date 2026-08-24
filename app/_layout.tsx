import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { WebDbProvider } from '../lib/DbContext';
import { ThemeProvider } from '../lib/ThemeContext';

function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Tasks' }} />
    </Stack>
  );
}

function NativeLayout() {
  const { SQLiteProvider } = require('expo-sqlite');
  const init = async (db: any) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        title     TEXT    NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        priority  INTEGER NOT NULL DEFAULT 1,
        due_date  TEXT
      );`);
    try { await db.execAsync('ALTER TABLE todos ADD COLUMN priority INTEGER NOT NULL DEFAULT 1;'); } catch (_) {}
    try { await db.execAsync('ALTER TABLE todos ADD COLUMN due_date TEXT;'); } catch (_) {}
  };
  return (
    <SQLiteProvider databaseName="stdphones.db" onInit={init}>
      <StackLayout />
    </SQLiteProvider>
  );
}

export default function RootLayout() {
  const Layout = Platform.OS === 'web'
    ? () => <WebDbProvider><StackLayout /></WebDbProvider>
    : NativeLayout;
  return <ThemeProvider><Layout /></ThemeProvider>;
}
