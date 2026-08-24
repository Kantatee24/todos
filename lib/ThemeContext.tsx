import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

// ─── Dark palette ────────────────────────────────────────────────────────────
const darkC = {
  bg:      '#050508',
  s1:      '#09091A',
  s2:      '#0E0E24',
  card:    '#121230',
  border:  '#1E1E48',
  purple:  '#7C5CFC',
  purpleL: '#A78BFA',
  purpleD: '#5039C8',
  cyan:    '#22D3EE',
  green:   '#0ECB8C',
  amber:   '#F5A520',
  red:     '#FF4747',
  t1:      '#FAFAFF',
  t2:      '#636E8A',
  t3:      '#30365A',
  t4:      '#1E1E48',
} as const;

// ─── Light palette ───────────────────────────────────────────────────────────
const lightC = {
  bg:      '#F0F2FF',
  s1:      '#E8EAFF',
  s2:      '#DEE1FF',
  card:    '#FFFFFF',
  border:  '#C4C9FF',
  purple:  '#6D5BFF',
  purpleL: '#4B38D4',
  purpleD: '#9580FF',
  cyan:    '#0891B2',
  green:   '#059669',
  amber:   '#D97706',
  red:     '#DC2626',
  t1:      '#0D1042',
  t2:      '#3B4080',
  t3:      '#6B75B5',
  t4:      '#C4C9FF',
} as const;

// ─── Priority tokens ─────────────────────────────────────────────────────────
const darkPRIO = [
  { label: 'Low',  tag: 'LOW',  color: '#0ECB8C', dark: '#071A12', glow: '#0ECB8C18' },
  { label: 'Med',  tag: 'MED',  color: '#F5A520', dark: '#1A1007', glow: '#F5A52018' },
  { label: 'High', tag: 'HIGH', color: '#FF4747', dark: '#1A0707', glow: '#FF474718' },
] as const;

const lightPRIO = [
  { label: 'Low',  tag: 'LOW',  color: '#059669', dark: '#DCFCE7', glow: '#05966918' },
  { label: 'Med',  tag: 'MED',  color: '#D97706', dark: '#FEF3C7', glow: '#D9770618' },
  { label: 'High', tag: 'HIGH', color: '#DC2626', dark: '#FEE2E2', glow: '#DC262618' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export type Colors  = typeof darkC;
export type PrioSet = typeof darkPRIO;

type Ctx = { C: Colors; PRIO: PrioSet; isDark: boolean; toggle: () => void };

const ThemeCtx = createContext<Ctx>({ C: darkC, PRIO: darkPRIO, isDark: true, toggle: () => {} });

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  return (
    <ThemeCtx.Provider value={{
      C:      isDark ? darkC    : lightC,
      PRIO:   isDark ? darkPRIO : lightPRIO,
      isDark,
      toggle: () => setIsDark(v => !v),
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() { return useContext(ThemeCtx); }

/** Web-only CSS properties */
export const W = (obj: Record<string, unknown>): Record<string, unknown> =>
  Platform.OS === 'web' ? obj : {};
