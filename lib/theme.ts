import { Platform } from 'react-native';

export const C = {
  bg:     '#050508',
  s1:     '#09091A',
  s2:     '#0E0E24',
  card:   '#121230',
  border: '#1E1E48',

  purple:  '#7C5CFC',
  purpleL: '#A78BFA',
  purpleD: '#5039C8',
  cyan:    '#22D3EE',
  green:   '#0ECB8C',
  amber:   '#F5A520',
  red:     '#FF4747',

  t1: '#FAFAFF',
  t2: '#636E8A',
  t3: '#30365A',
  t4: '#1E1E48',
} as const;

export const PRIO = [
  { label: 'Low',  tag: 'LOW',  color: '#0ECB8C', dark: '#071A12', glow: '#0ECB8C18' },
  { label: 'Med',  tag: 'MED',  color: '#F5A520', dark: '#1A1007', glow: '#F5A52018' },
  { label: 'High', tag: 'HIGH', color: '#FF4747', dark: '#1A0707', glow: '#FF474718' },
] as const;

/** Web-only CSS properties */
export const W = (obj: Record<string, unknown>): Record<string, unknown> =>
  Platform.OS === 'web' ? obj : {};
