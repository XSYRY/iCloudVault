import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMd3Theme } from '../theme';
import { LineIcon } from '../components/shared/LineIcon';
import { useSettingsStore } from '../store';
import { isBiometricsAvailable, authenticateBiometric, getBiometricType } from '../services/biometrics';
import type { RootStackScreenProps } from '../navigation/types';

const PIN_LENGTH = 4;

export function LockScreen({ navigation }: RootStackScreenProps<'Lock'>) {
  const theme = useMd3Theme();
  const storedPin = useSettingsStore((s) => s.pinCode);
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [bioType, setBioType] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    async function checkBio() {
      const available = await isBiometricsAvailable();
      setBioAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBioType(type);
      }
    }
    checkBio();
  }, []);

  useEffect(() => {
    if (biometricEnabled && bioAvailable) {
      tryBiometric();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tryBiometric = useCallback(async () => {
    const success = await authenticateBiometric();
    if (success) {
      navigation.replace('Main');
    }
  }, [navigation]);

  const handleDigit = useCallback(
    (digit: number) => {
      const next = input + digit.toString();
      setInput(next);
      if (next.length === PIN_LENGTH) {
        if (next === storedPin) {
          setInput('');
          setError(false);
          navigation.replace('Main');
        } else {
          setInput('');
          setError(true);
          setTimeout(() => setError(false), 600);
        }
      }
    },
    [input, storedPin, navigation],
  );

  const handleDelete = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < input.length);

  const bioLabel = bioType === 'FaceID' ? '面容 ID' : bioType === 'TouchID' ? '触控 ID' : '生物识别';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>输入PIN码</Text>

      <View style={styles.dotRow}>
        {dots.map((filled, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: filled ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: error ? theme.colors.error : theme.colors.outline,
              },
            ]}
          />
        ))}
      </View>

      {biometricEnabled && bioAvailable && (
        <Pressable
          style={[styles.bioBtn, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={tryBiometric}
        >
          <LineIcon name={bioType === 'FaceID' ? 'scan' : 'fingerprint'} size={20} color={theme.colors.onPrimaryContainer} />
          <Text style={[styles.bioLabel, { color: theme.colors.onPrimaryContainer }]}>
            使用{bioLabel}解锁
          </Text>
        </Pressable>
      )}

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2].map((digit, i) => {
          if (digit === -1) return <View key={i} style={styles.key} />;
          if (digit === -2)
            return (
              <Pressable key={i} style={styles.key} onPress={handleDelete}>
                <LineIcon name="delete" size={24} color={theme.colors.onSurface} />
              </Pressable>
            );
          return (
            <Pressable key={i} style={styles.key} onPress={() => handleDigit(digit)}>
              <View style={[styles.keyCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>{digit}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 40 },
  dotRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 24,
    gap: 8,
  },
  bioLabel: { fontSize: 14, fontWeight: '600' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 252, justifyContent: 'center' },
  key: { width: 84, height: 72, justifyContent: 'center', alignItems: 'center' },
  keyCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 24, fontWeight: '500' },
});
