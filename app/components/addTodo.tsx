import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useDb } from '../../lib/DbContext';
import { useTheme, W } from '../../lib/ThemeContext';

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatShort(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function quickDays() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    return { label, date: isoDate(d) };
  });
}

export default function AddTodo({ refresh, presetDate }: { refresh: () => void; presetDate?: string | null }) {
  const { C, PRIO, isDark } = useTheme();
  const [title,      setTitle]      = useState('');
  const [priority,   setPriority]   = useState(1);
  const [dueDate,    setDueDate]    = useState<string | null>(presetDate ?? null);
  const [datePicker, setDatePicker] = useState(false);
  const btnScale   = useRef(new Animated.Value(1)).current;
  const pickerH    = useRef(new Animated.Value(0)).current;
  const prevPreset = useRef(presetDate);
  const db = useDb();

  useEffect(() => {
    if (presetDate !== prevPreset.current) {
      prevPreset.current = presetDate;
      setDueDate(presetDate ?? null);
    }
  }, [presetDate]);

  const openPicker = () => {
    if (datePicker) {
      Animated.timing(pickerH, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setDatePicker(false));
    } else {
      setDatePicker(true);
      Animated.spring(pickerH, { toValue: 1, useNativeDriver: false, tension: 160, friction: 14 }).start();
    }
  };

  const pickDay = (date: string) => {
    setDueDate(prev => prev === date ? null : date);
    Animated.timing(pickerH, { toValue: 0, duration: 160, useNativeDriver: false }).start(() => setDatePicker(false));
  };

  const submit = async () => {
    if (!title.trim()) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.86, duration: 70,  useNativeDriver: false }),
      Animated.spring(btnScale,  { toValue: 1,    useNativeDriver: false, tension: 300, friction: 14 }),
    ]).start();
    try {
      await db.runAsync('INSERT INTO todos (title, completed, priority, due_date) VALUES (?, ?, ?, ?)',
        [title.trim(), 0, priority, dueDate]);
      setTitle(''); setDueDate(null); refresh();
    } catch (e: any) { Alert.alert(e.message); }
  };

  const p    = PRIO[priority];
  const days = quickDays();

  const shellBg = isDark ? 'rgba(5,5,8,0.94)' : 'rgba(240,242,255,0.95)';
  const glass   = W({ backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' });

  return (
    <View style={[s.shell, { backgroundColor: shellBg, borderTopColor: C.purple + '25' }, glass as any]}>

      {/* Preset banner */}
      {presetDate && presetDate === dueDate && (
        <View style={[s.banner, { backgroundColor: C.purple + '18', borderColor: C.purple + '40' }]}>
          <FontAwesome name="calendar-check-o" size={12} color={C.purple} />
          <Text style={[s.bannerTxt, { color: C.t2 }]}>
            Adding for <Text style={{ color: C.purple, fontWeight: '700' }}>{formatShort(presetDate)}</Text>
          </Text>
          <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="times" size={11} color={C.t3} />
          </TouchableOpacity>
        </View>
      )}

      {/* Date picker */}
      {datePicker && (
        <Animated.View style={[s.pickerWrap, { maxHeight: pickerH.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }), opacity: pickerH }]}>
          <View style={[s.pickerInner, { backgroundColor: C.s2, borderColor: C.border }]}>
            <TouchableOpacity style={[s.clearBtn, { backgroundColor: C.red + '18' }]}
              onPress={() => { setDueDate(null); openPicker(); }}>
              <FontAwesome name="times-circle" size={13} color={C.red} />
              <Text style={[s.clearTxt, { color: C.red }]}>Clear</Text>
            </TouchableOpacity>
            <View style={s.dayChips}>
              {days.map(d => (
                <TouchableOpacity key={d.date}
                  style={[s.dayChip, { backgroundColor: C.s1, borderColor: dueDate === d.date ? C.purple + '60' : C.border },
                    dueDate === d.date && { backgroundColor: C.purple + '18' }]}
                  onPress={() => pickDay(d.date)} activeOpacity={0.7}>
                  <Text style={[s.dayTxt, { color: dueDate === d.date ? C.purple : C.t2 }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Priority row */}
      <View style={s.optRow}>
        <Text style={[s.optLabel, { color: C.t3 }]}>PRIORITY</Text>
        <View style={s.prioGroup}>
          {PRIO.map((pr, i) => (
            <TouchableOpacity key={i}
              style={[s.prioBtn, { backgroundColor: C.s1, borderColor: priority === i ? pr.color : C.border },
                priority === i && { backgroundColor: pr.dark }]}
              onPress={() => setPriority(i)} activeOpacity={0.7}>
              <View style={[s.prioDot, { backgroundColor: pr.color }]} />
              <Text style={[s.prioTxt, { color: priority === i ? pr.color : C.t3 }]}>{pr.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[s.dateBtn, { backgroundColor: C.s1, borderColor: dueDate ? C.purple + '50' : C.border },
            dueDate && { backgroundColor: C.purple + '15' }]}
          onPress={openPicker} activeOpacity={0.7}>
          <FontAwesome name="calendar-o" size={12} color={dueDate ? C.purple : C.t3} />
          <Text style={[s.dateTxt, { color: dueDate ? C.purple : C.t3 }]}>
            {dueDate ? formatShort(dueDate) : 'Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View style={s.inputRow}>
        <View style={[s.inputWrap, { backgroundColor: C.s1, borderColor: title.length > 0 ? p.color + '55' : C.border }]}>
          <TextInput
            style={[s.input, { color: C.t1 }]}
            placeholder="New task..."
            placeholderTextColor={C.t3}
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={submit}
            returnKeyType="done"
            selectionColor={C.purple}
          />
        </View>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: title.trim() ? C.purple : C.s2 }]}
            onPress={submit} activeOpacity={0.85}>
            <FontAwesome name="plus" size={18} color={title.trim() ? '#fff' : C.t3} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  shell:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28, borderTopWidth: 1 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderWidth: 1 },
  bannerTxt:  { fontSize: 12, flex: 1 },
  pickerWrap: { overflow: 'hidden', marginBottom: 6 },
  pickerInner:{ borderRadius: 14, padding: 10, borderWidth: 1, marginBottom: 2 },
  clearBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', marginBottom: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  clearTxt:   { fontSize: 11, fontWeight: '700' },
  dayChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip:    { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  dayTxt:     { fontSize: 12, fontWeight: '600' },
  optRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  optLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  prioGroup:  { flexDirection: 'row', gap: 6, flex: 1 },
  prioBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  prioDot:    { width: 6, height: 6, borderRadius: 3 },
  prioTxt:    { fontSize: 11, fontWeight: '700' },
  dateBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  dateTxt:    { fontSize: 11, fontWeight: '700' },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrap:  { flex: 1, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  input:      { fontSize: 15, fontWeight: '500', paddingHorizontal: 16, paddingVertical: 13 },
  addBtn:     { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
