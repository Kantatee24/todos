import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import AddTodo from './components/addTodo';
import Card from './components/card';
import CalendarView from './components/CalendarView';
import { useDb } from '../lib/DbContext';
import { useTheme, W } from '../lib/ThemeContext';

type Todo   = { id: number; title: string; completed: number; priority: number; due_date: string | null };
type Filter = 'all' | 'active' | 'done';
type View   = 'list' | 'calendar';

function todayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export default function Index() {
  const db = useDb();
  const { C, isDark, toggle } = useTheme();
  const [todos,        setTodos]        = useState<Todo[]>([]);
  const [filter,       setFilter]       = useState<Filter>('all');
  const [view,         setView]         = useState<View>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fadeIn    = useRef(new Animated.Value(0)).current;
  const viewFade  = useRef(new Animated.Value(1)).current;
  const indicator = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try { setTodos(await db.getAllAsync<Todo>('SELECT * FROM todos ORDER BY id DESC')); }
    catch { Alert.alert('Cannot read todos'); }
  };

  useEffect(() => {
    load();
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, []);

  const switchView = (v: View) => {
    if (v === view) return;
    Animated.timing(viewFade, { toValue: 0, duration: 130, useNativeDriver: false }).start(() => {
      setView(v); setSelectedDate(null);
      Animated.timing(viewFade, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    });
    Animated.spring(indicator, { toValue: v === 'list' ? 0 : 1, useNativeDriver: false, tension: 200, friction: 20 }).start();
  };

  const addForDate = async (title: string, priority: number, date: string) => {
    try {
      await db.runAsync('INSERT INTO todos (title, completed, priority, due_date) VALUES (?, ?, ?, ?)', [title, 0, priority, date]);
      await load();
    } catch (e: any) { Alert.alert(e.message); }
  };

  const today    = todayIso();
  const done     = todos.filter(t => t.completed).length;
  const active   = todos.length - done;
  const overdue  = todos.filter(t => !t.completed && t.due_date && t.due_date < today).length;
  const pct      = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;
  const dueToday = todos.filter(t => !t.completed && t.due_date === today).length;

  const filtered = todos.filter(t =>
    filter === 'active' ? !t.completed :
    filter === 'done'   ? !!t.completed : true
  );

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const indicatorLeft = indicator.interpolate({ inputRange: [0, 1], outputRange: ['1.5%', '51%'] });

  const webProg = W({ background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})` });

  return (
    <View style={[s.bg, { backgroundColor: C.bg }]}>
      {/* Dynamic header */}
      <Stack.Screen options={{
        headerStyle:      { backgroundColor: C.bg },
        headerTitleStyle: { color: C.t1, fontWeight: '800', fontSize: 17 },
        headerTintColor:  C.purple,
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={toggle} style={s.themeBtn} activeOpacity={0.7}>
            <FontAwesome
              name={isDark ? 'sun-o' : 'moon-o'}
              size={19}
              color={isDark ? C.amber : C.purple}
            />
          </TouchableOpacity>
        ),
      }} />

      <Animated.View style={[s.inner, { opacity: fadeIn }]}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={[s.heroDate, { color: C.t3 }]}>{dateStr}</Text>
            {overdue > 0 && (
              <View style={[s.overdueChip, { backgroundColor: C.red + '18', borderColor: C.red + '40' }]}>
                <FontAwesome name="exclamation-circle" size={10} color={C.red} />
                <Text style={[s.overdueTxt, { color: C.red }]}>{overdue} overdue</Text>
              </View>
            )}
          </View>
          <View style={s.heroMid}>
            <Text style={[s.heroNum, { color: C.t1 }]}>{active}</Text>
            <View style={s.heroLabels}>
              <Text style={[s.heroLabel1, { color: C.t2 }]}>tasks</Text>
              <Text style={[s.heroLabel2, { color: C.t3 }]}>remaining</Text>
            </View>
            {dueToday > 0 && (
              <View style={[s.todayChip, { backgroundColor: C.purple + '18', borderColor: C.purple + '40' }]}>
                <Text style={[s.todayChipTxt, { color: C.purple }]}>{dueToday} today</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress */}
        <View style={s.progressBlock}>
          <View style={s.progressMeta}>
            <Text style={[s.progressLabel, { color: C.t3 }]}>Progress</Text>
            <Text style={[s.progressPct, { color: pct === 100 ? C.green : C.purple }]}>
              {pct === 100 ? '✓ All done' : `${pct}%`}
            </Text>
          </View>
          <View style={[s.progressBg, { backgroundColor: C.s2 }]}>
            <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: C.purple }, webProg as any]} />
          </View>
        </View>

        {/* Mini stats */}
        <View style={s.statsRow}>
          {([
            { v: todos.length, l: 'Total',   c: C.t2 },
            { v: done,         l: 'Done',    c: C.green },
            { v: active,       l: 'Active',  c: C.purple },
            { v: overdue,      l: 'Overdue', c: overdue > 0 ? C.red : C.t3 },
          ] as const).map(st => (
            <View key={st.l} style={[s.statChip, { backgroundColor: C.s1, borderColor: C.border }]}>
              <Text style={[s.statNum, { color: st.c }]}>{st.v}</Text>
              <Text style={[s.statLbl, { color: C.t3 }]}>{st.l}</Text>
            </View>
          ))}
        </View>

        {/* View toggle */}
        <View style={[s.toggleWrap, { backgroundColor: C.s1, borderColor: C.border }]}>
          <Animated.View style={[s.toggleIndicator, { left: indicatorLeft, backgroundColor: C.s2, borderColor: C.border }]} />
          <TouchableOpacity style={s.toggleBtn} onPress={() => switchView('list')} activeOpacity={0.8}>
            <FontAwesome name="list" size={13} color={view === 'list' ? C.t1 : C.t3} />
            <Text style={[s.toggleTxt, { color: view === 'list' ? C.t1 : C.t3 }]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toggleBtn} onPress={() => switchView('calendar')} activeOpacity={0.8}>
            <FontAwesome name="calendar" size={13} color={view === 'calendar' ? C.t1 : C.t3} />
            <Text style={[s.toggleTxt, { color: view === 'calendar' ? C.t1 : C.t3 }]}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View style={[s.content, { opacity: viewFade }]}>
          {view === 'list' ? (
            <>
              <View style={s.filterRow}>
                {([
                  { key: 'all',    label: 'All',    count: todos.length },
                  { key: 'active', label: 'Active', count: active },
                  { key: 'done',   label: 'Done',   count: done },
                ] as const).map(f => (
                  <TouchableOpacity key={f.key}
                    style={[s.filterBtn,
                      { backgroundColor: C.s1, borderColor: filter === f.key ? C.purple + '50' : C.border },
                      filter === f.key && { backgroundColor: C.s2 }]}
                    onPress={() => setFilter(f.key)} activeOpacity={0.7}>
                    <Text style={[s.filterTxt, { color: filter === f.key ? C.t1 : C.t3 }]}>{f.label}</Text>
                    <View style={[s.filterCount,
                      { backgroundColor: filter === f.key ? C.purple : C.s2 }]}>
                      <Text style={[s.filterCountTxt, { color: filter === f.key ? '#fff' : C.t3 }]}>{f.count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                data={filtered}
                keyExtractor={i => String(i.id)}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => <Card todo={item} refresh={load} index={index} />}
                ListEmptyComponent={<Empty filter={filter} />}
              />
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.calScroll}>
              <CalendarView
                todos={todos}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onAddForDate={addForDate}
              />
              {!selectedDate && (
                <Text style={[s.calHint, { color: C.t4 }]}>Tap a date · Dots show tasks by priority</Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>

      <AddTodo
        refresh={load}
        presetDate={view === 'calendar' && selectedDate && selectedDate >= today ? selectedDate : null}
      />
    </View>
  );
}

function Empty({ filter }: { filter: Filter }) {
  const { C } = useTheme();
  const map: Record<Filter, [string, string]> = {
    all:    ['No tasks yet',      'Add your first task below'],
    active: ['All caught up',     'Nothing left to do'],
    done:   ['Nothing done yet',  'Complete a task to see it here'],
  };
  const [h, sub] = map[filter];
  return (
    <View style={s.empty}>
      <View style={[s.emptyIcon, { backgroundColor: C.s1, borderColor: C.border }]}>
        <FontAwesome name={filter === 'done' ? 'trophy' : 'check-square-o'} size={28} color={C.t4} />
      </View>
      <Text style={[s.emptyH, { color: C.t2 }]}>{h}</Text>
      <Text style={[s.emptyS, { color: C.t3 }]}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bg:    { flex: 1 },
  inner: { flex: 1 },
  themeBtn: { paddingRight: 16, paddingVertical: 8 },

  hero:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroDate:   { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  overdueChip:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  overdueTxt: { fontSize: 11, fontWeight: '700' },
  heroMid:    { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  heroNum:    { fontSize: 56, fontWeight: '900', lineHeight: 60, letterSpacing: -2 },
  heroLabels: { paddingBottom: 6 },
  heroLabel1: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
  heroLabel2: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  todayChip:  { marginLeft: 'auto' as any, alignSelf: 'flex-end', marginBottom: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  todayChipTxt:{ fontSize: 12, fontWeight: '700' },

  progressBlock: { paddingHorizontal: 20, marginBottom: 14 },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressPct:   { fontSize: 11, fontWeight: '700' },
  progressBg:    { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  statsRow:  { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  statChip:  { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  statNum:   { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  statLbl:   { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },

  toggleWrap:      { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 4, borderWidth: 1, position: 'relative' },
  toggleIndicator: { position: 'absolute', top: 4, width: '48%', bottom: 4, borderRadius: 11, borderWidth: 1 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, zIndex: 1 },
  toggleTxt:       { fontWeight: '700', fontSize: 14 },

  content:  { flex: 1 },
  filterRow:{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 6 },
  filterBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  filterTxt:{ fontWeight: '700', fontSize: 13 },
  filterCount:    { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountTxt: { fontSize: 11, fontWeight: '800' },

  list:      { paddingHorizontal: 16, paddingBottom: 180, paddingTop: 2 },
  calScroll: { paddingBottom: 180 },
  calHint:   { textAlign: 'center', fontSize: 12, marginTop: 12 },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH:    { fontSize: 17, fontWeight: '700' },
  emptyS:    { fontSize: 13, marginTop: 5 },
});
