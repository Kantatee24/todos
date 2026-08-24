import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../lib/ThemeContext';

type Todo = { id: number; title: string; completed: number; priority: number; due_date: string | null };
interface Props {
  todos: Todo[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  onAddForDate: (title: string, priority: number, date: string) => Promise<void>;
}

const DAYS   = ['S','M','T','W','T','F','S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function todayIso() {
  const n = new Date();
  return iso(n.getFullYear(), n.getMonth(), n.getDate());
}
function formatDateLong(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatShort(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CalendarView({ todos, selectedDate, onSelectDate, onAddForDate }: Props) {
  const { C, PRIO } = useTheme();
  const now  = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [newTitle, setNewTitle] = useState('');
  const [newPrio,  setNewPrio]  = useState(1);
  const [adding,   setAdding]   = useState(false);
  const slideX  = useRef(new Animated.Value(0)).current;
  const fade    = useRef(new Animated.Value(1)).current;
  const addBtnS = useRef(new Animated.Value(1)).current;
  const today   = todayIso();

  const taskMap: Record<string, Todo[]> = {};
  todos.forEach(t => { if (t.due_date) { taskMap[t.due_date] ??= []; taskMap[t.due_date].push(t); } });

  const navigate = (dir: -1 | 1) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade,   { toValue: 0, duration: 120, useNativeDriver: false }),
        Animated.timing(slideX, { toValue: dir * -30, duration: 120, useNativeDriver: false }),
      ]),
      Animated.timing(slideX, { toValue: dir * 30, duration: 0, useNativeDriver: false }),
    ]).start(() => {
      setMonth(prev => {
        const nx = prev + dir;
        if (nx < 0)  { setYear(y => y - 1); return 11; }
        if (nx > 11) { setYear(y => y + 1); return 0;  }
        return nx;
      });
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(slideX, { toValue: 0, duration: 180, useNativeDriver: false }),
      ]).start();
    });
  };

  const handleQuickAdd = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    setAdding(true);
    Animated.sequence([
      Animated.timing(addBtnS, { toValue: 0.85, duration: 70, useNativeDriver: false }),
      Animated.spring(addBtnS, { toValue: 1, useNativeDriver: false, tension: 300, friction: 14 }),
    ]).start();
    await onAddForDate(newTitle.trim(), newPrio, selectedDate);
    setNewTitle(''); setNewPrio(1); setAdding(false);
  };

  const firstWD  = new Date(year, month, 1).getDay();
  const daysInMo = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWD).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const selectedTasks = selectedDate ? (taskMap[selectedDate] ?? []) : [];
  const isPastDate    = !!selectedDate && selectedDate < today;

  return (
    <View style={[s.wrap, { backgroundColor: C.s1, borderColor: C.border }]}>

      {/* Month nav */}
      <View style={[s.nav, { borderBottomColor: C.border }]}>
        <TouchableOpacity style={[s.navBtn, { backgroundColor: C.s2, borderColor: C.border }]} onPress={() => navigate(-1)} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={12} color={C.purple} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={[s.navMonth, { color: C.t1 }]}>{MONTHS[month]}</Text>
          <Text style={[s.navYear, { color: C.t3 }]}>{year}</Text>
        </View>
        <TouchableOpacity
          style={[s.todayBtn, { backgroundColor: C.purple + '18', borderColor: C.purple + '40' }]}
          onPress={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); onSelectDate(today); }}
          activeOpacity={0.7}>
          <Text style={[s.todayTxt, { color: C.purple }]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.navBtn, { backgroundColor: C.s2, borderColor: C.border }]} onPress={() => navigate(1)} activeOpacity={0.7}>
          <FontAwesome name="chevron-right" size={12} color={C.purple} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={s.dayRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={[s.dayHdr, { color: i === 0 || i === 6 ? C.t2 : C.t3 }]}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <Animated.View style={{ opacity: fade, transform: [{ translateX: slideX }], paddingHorizontal: 8, paddingBottom: 10 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((day, ci) => {
              if (!day) return <View key={ci} style={s.cell} />;
              const dateStr  = iso(year, month, day);
              const dayTasks = taskMap[dateStr] ?? [];
              const isToday  = dateStr === today;
              const isSel    = dateStr === selectedDate;
              const isPast   = dateStr < today;
              const overdue  = dayTasks.some(t => !t.completed && isPast);

              return (
                <TouchableOpacity key={ci}
                  style={[
                    s.cell,
                    isPast && !isToday && s.cellPast,
                    isToday && !isSel && [s.cellToday, { borderColor: C.purple + '70' }],
                    isSel && { backgroundColor: C.purple },
                  ]}
                  onPress={() => onSelectDate(isSel ? null : dateStr)}
                  activeOpacity={isPast ? 0.4 : 0.7}>
                  <Text style={[
                    s.cellNum,
                    { color: C.t2 },
                    isPast && !isToday && { color: C.t3, opacity: 0.5 },
                    isToday && !isSel && { color: C.purple, fontWeight: '800' },
                    isSel && { color: '#fff', fontWeight: '800' },
                    overdue && !isSel && { color: C.red },
                  ]}>
                    {day}
                  </Text>
                  {dayTasks.length > 0 && (
                    <View style={s.dotRow}>
                      {dayTasks.slice(0, 3).map((t, di) => (
                        <View key={di} style={[s.dot, { backgroundColor: t.completed ? C.green : PRIO[t.priority ?? 1]?.color ?? C.t3 }]} />
                      ))}
                      {dayTasks.length > 3 && <Text style={[s.dotMore, { color: C.t3 }]}>+</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* Legend */}
      <View style={[s.legend, { borderTopColor: C.border }]}>
        {PRIO.map(p => (
          <View key={p.tag} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: p.color }]} />
            <Text style={[s.legendTxt, { color: C.t3 }]}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* Selected date panel */}
      {selectedDate && (
        <View style={[s.panel, { borderTopColor: C.border }]}>
          <View style={s.panelHdr}>
            <View style={s.panelHdrL}>
              <FontAwesome name="calendar-check-o" size={13} color={C.purple} />
              <Text style={[s.panelDate, { color: C.t1 }]}>{formatDateLong(selectedDate)}</Text>
            </View>
            <View style={[s.panelBadge,
              { backgroundColor: selectedTasks.length > 0 ? C.purple : C.s2, borderColor: C.border }]}>
              <Text style={[s.panelBadgeTxt, { color: selectedTasks.length > 0 ? '#fff' : C.t3 }]}>
                {selectedTasks.length}
              </Text>
            </View>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={s.panelEmpty}>
              <FontAwesome name={isPastDate ? 'lock' : 'calendar-plus-o'} size={22} color={C.t4} />
              <Text style={[s.panelEmptyTxt, { color: C.t3 }]}>
                {isPastDate ? 'No tasks on this day' : 'No tasks — add one below'}
              </Text>
            </View>
          ) : (
            selectedTasks.map(t => {
              const tp = PRIO[t.priority ?? 1] ?? PRIO[1];
              return (
                <View key={t.id} style={[s.panelCard, { backgroundColor: C.s2, borderLeftColor: tp.color }]}>
                  <View style={[s.panelCheck, { borderColor: t.completed ? tp.color : C.border },
                    t.completed ? { backgroundColor: tp.dark } : null]}>
                    {!!t.completed && <FontAwesome name="check" size={8} color={tp.color} />}
                  </View>
                  <Text style={[s.panelTitle, { color: C.t1 }, !!t.completed && { textDecorationLine: 'line-through', color: C.t3 }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <View style={[s.panelPrio, { backgroundColor: tp.dark }]}>
                    <Text style={[s.panelPrioTxt, { color: tp.color }]}>{tp.tag}</Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Quick-add */}
          {isPastDate ? (
            <View style={[s.pastLock, { borderTopColor: C.border }]}>
              <FontAwesome name="lock" size={12} color={C.t3} />
              <Text style={[s.pastLockTxt, { color: C.t3 }]}>วันที่ผ่านมาแล้ว — ไม่สามารถเพิ่ม task ได้</Text>
            </View>
          ) : (
            <View style={[s.qaWrap, { borderTopColor: C.border }]}>
              <View style={s.qaPrios}>
                {PRIO.map((p, i) => (
                  <TouchableOpacity key={i}
                    style={[s.qaDot, { backgroundColor: newPrio === i ? p.color : C.s1, borderColor: newPrio === i ? p.color : C.border }]}
                    onPress={() => setNewPrio(i)} activeOpacity={0.7} />
                ))}
              </View>
              <View style={[s.qaInputWrap, { backgroundColor: C.s2, borderColor: newTitle.length > 0 ? PRIO[newPrio].color + '50' : C.border }]}>
                <TextInput
                  style={[s.qaInput, { color: C.t1 }]}
                  placeholder={`เพิ่ม task วัน ${formatShort(selectedDate)}...`}
                  placeholderTextColor={C.t3}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  onSubmitEditing={handleQuickAdd}
                  returnKeyType="done"
                  selectionColor={C.purple}
                  editable={!adding}
                />
              </View>
              <Animated.View style={{ transform: [{ scale: addBtnS }] }}>
                <TouchableOpacity
                  style={[s.qaBtn, { backgroundColor: newTitle.trim() ? C.purple : C.s2 }]}
                  onPress={handleQuickAdd} activeOpacity={0.8}>
                  <FontAwesome name="plus" size={14} color={newTitle.trim() ? '#fff' : C.t3} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { borderRadius: 20, marginHorizontal: 16, marginTop: 12, borderWidth: 1, overflow: 'hidden' },
  nav:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
  navBtn:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  navCenter:  { flex: 1, alignItems: 'center' },
  navMonth:   { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  navYear:    { fontSize: 11, fontWeight: '600', marginTop: 1 },
  todayBtn:   { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  todayTxt:   { fontSize: 12, fontWeight: '700' },
  dayRow:     { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 },
  dayHdr:     { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  row:        { flexDirection: 'row' },
  cell:       { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, margin: 1 },
  cellPast:   { opacity: 0.4 },
  cellToday:  { borderWidth: 1.5 },
  cellNum:    { fontSize: 14, fontWeight: '500' },
  dotRow:     { flexDirection: 'row', gap: 2, marginTop: 3, alignItems: 'center' },
  dot:        { width: 5, height: 5, borderRadius: 3 },
  dotMore:    { fontSize: 8, fontWeight: '700' },
  legend:     { flexDirection: 'row', justifyContent: 'center', gap: 18, paddingVertical: 10, borderTopWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendTxt:  { fontSize: 11 },
  panel:      { borderTopWidth: 1, padding: 14 },
  panelHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  panelHdrL:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelDate:  { fontSize: 14, fontWeight: '700' },
  panelBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  panelBadgeTxt: { fontSize: 11, fontWeight: '800' },
  panelEmpty: { alignItems: 'center', paddingVertical: 14, gap: 6 },
  panelEmptyTxt: { fontSize: 13 },
  panelCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 11, marginBottom: 6, borderLeftWidth: 3 },
  panelCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontSize: 13, fontWeight: '500', flex: 1 },
  panelPrio:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  panelPrioTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  pastLock:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, paddingVertical: 10 },
  pastLockTxt:{ fontSize: 12, fontStyle: 'italic' },
  qaWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  qaPrios:    { flexDirection: 'row', gap: 5 },
  qaDot:      { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  qaInputWrap:{ flex: 1, borderRadius: 11, borderWidth: 1, overflow: 'hidden' },
  qaInput:    { fontSize: 13, paddingHorizontal: 12, paddingVertical: 9 },
  qaBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
