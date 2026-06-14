import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PIP_LAYOUT, DiceColor, CARD_BORDER } from './colors';

type Props = { value: number; color: DiceColor; size?: number };

// A dice face drawn from plain Views (no image assets). The bold face color
// plus a thick white border keeps it sharp and visible on any background.
export function Dice({ value, color, size = 150 }: Props) {
  if (value === 0) {
    // Idle placeholder before the first roll.
    return (
      <View
        style={[
          styles.dice,
          {
            width: size,
            height: size,
            backgroundColor: '#EFE7D6',
            borderRadius: size * 0.17,
            borderWidth: size * 0.03,
            borderColor: CARD_BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: '#C9BCA3' }}>?</Text>
      </View>
    );
  }

  const lit = PIP_LAYOUT[value] ?? [];
  const pip = size * 0.16;
  return (
    <View
      style={[
        styles.dice,
        {
          width: size,
          height: size,
          backgroundColor: color.hex,
          padding: size * 0.12,
          borderRadius: size * 0.17,
          borderWidth: size * 0.035,
        },
      ]}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={styles.cell}>
          {lit.includes(i) ? (
            <View
              style={{ width: pip, height: pip, borderRadius: pip / 2, backgroundColor: color.pip }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderColor: '#FFFFFF',
  },
  cell: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
