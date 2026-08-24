import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme, W } from '../../lib/ThemeContext';

interface Props {
  visible: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ visible, taskTitle, onConfirm, onCancel }: Props) {
  const { C } = useTheme();
  const backdropO = useRef(new Animated.Value(0)).current;
  const cardY     = useRef(new Animated.Value(60)).current;
  const cardS     = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.spring(cardY,     { toValue: 0, useNativeDriver: false, tension: 160, friction: 12 }),
        Animated.spring(cardS,     { toValue: 1, useNativeDriver: false, tension: 160, friction: 12 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 0,    duration: 160, useNativeDriver: false }),
        Animated.timing(cardY,     { toValue: 60,   duration: 160, useNativeDriver: false }),
        Animated.timing(cardS,     { toValue: 0.88, duration: 160, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const shadow = W({ boxShadow: '0 -4px 60px rgba(0,0,0,0.5), 0 0 40px rgba(220,38,38,0.12)' });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[s.backdrop, { opacity: backdropO }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <View style={s.center} pointerEvents="box-none">
        <Animated.View style={[
          s.card,
          { backgroundColor: C.s1, borderColor: C.red + '30', transform: [{ translateY: cardY }, { scale: cardS }] },
          shadow as any,
        ]}>
          {/* Icon */}
          <View style={[s.iconBg, { backgroundColor: C.red + '18', borderColor: C.red + '35' }]}>
            <FontAwesome name="trash-o" size={22} color={C.red} />
          </View>

          <Text style={[s.heading, { color: C.t1 }]}>ลบ Task นี้?</Text>

          {/* Task name */}
          <View style={[s.taskBox, { backgroundColor: C.s2, borderColor: C.border }]}>
            <Text style={[s.taskTitle, { color: C.t2 }]} numberOfLines={2}>"{taskTitle}"</Text>
          </View>

          <Text style={[s.warning, { color: C.t3 }]}>ไม่สามารถกู้คืนได้หลังจากลบ</Text>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.cancelBtn, { backgroundColor: C.s2, borderColor: C.border }]}
              onPress={onCancel} activeOpacity={0.7}
            >
              <Text style={[s.cancelTxt, { color: C.t2 }]}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.deleteBtn, { backgroundColor: C.red }]} onPress={onConfirm} activeOpacity={0.8}>
              <FontAwesome name="trash" size={14} color="#fff" />
              <Text style={s.deleteTxt}>ลบออก</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  center:   { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:     { width: '100%', maxWidth: 360, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1 },
  iconBg:   { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 18 },
  heading:  { fontSize: 20, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  taskBox:  { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, width: '100%', marginBottom: 14, borderWidth: 1 },
  taskTitle:{ fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  warning:  { fontSize: 12, marginBottom: 24 },
  btnRow:   { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn:{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  cancelTxt:{ fontSize: 15, fontWeight: '700' },
  deleteBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  deleteTxt:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});
