import { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDb } from '../../lib/DbContext';
import { useTheme, W } from '../../lib/ThemeContext';
import ConfirmModal from './ConfirmModal';

type Todo = { id: number; title: string; completed: number; priority: number; due_date: string | null };

function getDueInfo(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const diff   = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)   return { text: `${-diff}d overdue`, key: 'red'    as const };
  if (diff === 0) return { text: 'Due today',         key: 'amber'  as const };
  if (diff === 1) return { text: 'Tomorrow',          key: 'purple' as const };
  if (diff <= 6)  return { text: target.toLocaleDateString('en', { weekday: 'short' }), key: 'muted' as const };
  return { text: target.toLocaleDateString('en', { month: 'short', day: 'numeric' }), key: 'faint' as const };
}

export default function Card({ todo, refresh, index }: { todo: Todo; refresh: () => void; index: number }) {
  const db = useDb();
  const { C, PRIO } = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const mountY   = useRef(new Animated.Value(16)).current;
  const mountO   = useRef(new Animated.Value(0)).current;
  const scaleRef = useRef(new Animated.Value(1)).current;
  const exitO    = useRef(new Animated.Value(1)).current;

  const p   = PRIO[todo.priority ?? 1] ?? PRIO[1];
  const raw = todo.due_date && !todo.completed ? getDueInfo(todo.due_date) : null;
  const dueColor = raw
    ? raw.key === 'red'    ? C.red
    : raw.key === 'amber'  ? C.amber
    : raw.key === 'purple' ? C.purpleL
    : raw.key === 'muted'  ? C.t2
    : C.t3
    : C.t3;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mountY, { toValue: 0, delay: Math.min(index * 40, 280), useNativeDriver: false, tension: 140, friction: 12 }),
      Animated.timing(mountO, { toValue: 1, delay: Math.min(index * 40, 280), duration: 280,           useNativeDriver: false }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scaleRef, { toValue: 0.975, useNativeDriver: false, tension: 400, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scaleRef, { toValue: 1,     useNativeDriver: false, tension: 400, friction: 20 }).start();

  const toggle = async () => {
    try {
      await db.runAsync('UPDATE todos SET completed = ? WHERE id = ?', [(todo.completed + 1) % 2, todo.id]);
      refresh();
    } catch (e: any) { Alert.alert(e.message); }
  };

  const confirmDelete = () => {
    setConfirmVisible(false);
    Animated.parallel([
      Animated.timing(exitO,    { toValue: 0,    duration: 220, useNativeDriver: false }),
      Animated.timing(scaleRef, { toValue: 0.88, duration: 220, useNativeDriver: false }),
    ]).start(async () => {
      try { await db.runAsync('DELETE FROM todos WHERE id = ?', [todo.id]); refresh(); }
      catch (e: any) { Alert.alert(e.message); }
    });
  };

  const shadow = W({ boxShadow: `0 2px 16px ${p.glow}, 0 1px 4px rgba(0,0,0,0.3)` });

  return (
    <>
      <ConfirmModal
        visible={confirmVisible}
        taskTitle={todo.title}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
      <Animated.View style={[
        s.wrap,
        { backgroundColor: C.card, borderColor: C.border,
          opacity: Animated.multiply(exitO, mountO),
          transform: [{ scale: scaleRef }, { translateY: mountY }] },
        shadow as any,
      ]}>
        <View style={[s.accent, { backgroundColor: p.color }]} />

        <Pressable style={s.body} onPressIn={onPressIn} onPressOut={onPressOut} onPress={toggle}>
          {/* Row 1 */}
          <View style={s.row1}>
            <View style={[s.checkbox,
              { borderColor: todo.completed ? p.color : C.border },
              todo.completed ? { backgroundColor: p.dark } : { backgroundColor: 'transparent' },
            ]}>
              {!!todo.completed && <FontAwesome name="check" size={10} color={p.color} />}
            </View>

            <Text style={[s.title, { color: C.t1 }, !!todo.completed && { textDecorationLine: 'line-through', color: C.t3 }]} numberOfLines={2}>
              {todo.title}
            </Text>

            <TouchableOpacity onPress={() => setConfirmVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome name="trash-o" size={14} color={C.t3} />
            </TouchableOpacity>
          </View>

          {/* Row 2 — badges */}
          <View style={s.row2}>
            <View style={[s.prioTag, { backgroundColor: p.dark, borderColor: p.color + '30' }]}>
              <View style={[s.prioDot, { backgroundColor: p.color }]} />
              <Text style={[s.prioText, { color: p.color }]}>{p.tag}</Text>
            </View>

            {raw && (
              <View style={[s.dueBadge, { backgroundColor: C.s2, borderColor: dueColor + '40' }]}>
                <FontAwesome name="clock-o" size={9} color={dueColor} />
                <Text style={[s.dueText, { color: dueColor }]}>{raw.text}</Text>
              </View>
            )}

            {!!todo.completed && !raw && (
              <View style={[s.doneBadge, { backgroundColor: C.green + '18' }]}>
                <FontAwesome name="check-circle" size={9} color={C.green} />
                <Text style={[s.doneText, { color: C.green }]}>Completed</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </>
  );
}

const s = StyleSheet.create({
  wrap:     { flexDirection: 'row', borderRadius: 14, marginVertical: 4, borderWidth: 1, overflow: 'hidden' },
  accent:   { width: 3 },
  body:     { flex: 1, paddingHorizontal: 14, paddingVertical: 13 },
  row1:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  row2:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' },
  prioTag:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  prioDot:  { width: 5, height: 5, borderRadius: 3 },
  prioText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  dueText:  { fontSize: 11, fontWeight: '600' },
  doneBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  doneText: { fontSize: 11, fontWeight: '600' },
});
