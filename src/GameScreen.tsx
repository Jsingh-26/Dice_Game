import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Easing,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dice } from './Dice';
import { Confetti } from './Confetti';
import { play } from './sounds';
import {
  DICE_COLORS,
  DiceColor,
  NUMBER_WORDS,
  STICKERS,
  SCREEN_BG,
  TEXT_DARK,
  TEXT_SOFT,
  CARD_BORDER,
} from './colors';

type Phase = 'idle' | 'rolling' | 'count' | 'word' | 'color' | 'sum' | 'done';
type Mode = 'simple' | 'challenge';
type OptKind = 'number' | 'word' | 'color';
type Option = { id: string; kind: OptKind; num?: number; color?: DiceColor; correct: boolean };

const STICKER_KEY = '@rollandlearn:stickers';
const topPad = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 24 : 0;

const rint = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]): T => arr[rint(arr.length)];
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rint(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function haptic(type: 'light' | 'success' | 'warning') {
  try {
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}

function OptionButton({
  opt,
  disabled,
  revealed,
  onPress,
}: {
  opt: Option;
  disabled: boolean;
  revealed: boolean;
  onPress: (o: Option) => boolean;
}) {
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handle = () => {
    if (disabled) return;
    const ok = onPress(opt);
    if (!ok) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  };

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });
  const correctReveal = revealed && opt.correct;

  return (
    <Animated.View style={{ transform: [{ translateX }, { scale }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
        onPress={handle}
        disabled={disabled}
        style={[styles.opt, correctReveal && styles.optCorrect]}
      >
        {opt.kind === 'color' ? (
          // Show only the color *name* (in neutral dark text) so the child has
          // to read the word — not just match a colored swatch by sight.
          <Text style={styles.optWord} numberOfLines={1} adjustsFontSizeToFit>
            {opt.color!.name}
          </Text>
        ) : opt.kind === 'word' ? (
          <Text style={styles.optWord}>{NUMBER_WORDS[opt.num!]}</Text>
        ) : (
          <Text style={styles.optNum}>{opt.num}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function GameScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('simple');
  const [value, setValue] = useState(1);
  const [color, setColor] = useState<DiceColor>(DICE_COLORS[0]);
  const [value2, setValue2] = useState(1);
  const [display, setDisplay] = useState<{ v: number; c: DiceColor }>({ v: 0, c: DICE_COLORS[0] });
  const [display2, setDisplay2] = useState<{ v: number; c: DiceColor }>({ v: 0, c: DICE_COLORS[1] });
  const [options, setOptions] = useState<Option[]>([]);
  const [stars, setStars] = useState(0);
  const [stickers, setStickers] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [prompt, setPrompt] = useState('Tap the big button to roll!');

  const rotate = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STICKER_KEY).then((raw) => {
      if (raw) {
        try {
          setStickers(JSON.parse(raw));
        } catch {}
      }
    });
    return () => timers.current.forEach((t) => clearTimeout(t));
  }, []);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  function persist(list: string[]) {
    AsyncStorage.setItem(STICKER_KEY, JSON.stringify(list)).catch(() => {});
  }

  function numberOptions(correct: number, kind: 'number' | 'word'): Option[] {
    const others = shuffle([1, 2, 3, 4, 5, 6].filter((n) => n !== correct)).slice(0, 2);
    return shuffle([correct, ...others]).map((n) => ({
      id: `${kind}-${n}`,
      kind,
      num: n,
      correct: n === correct,
    }));
  }
  function colorOptions(correct: DiceColor): Option[] {
    const others = shuffle(DICE_COLORS.filter((c) => c.key !== correct.key)).slice(0, 2);
    return shuffle([correct, ...others]).map((c) => ({
      id: `color-${c.key}`,
      kind: 'color',
      color: c,
      correct: c.key === correct.key,
    }));
  }
  // For Challenge mode: the answer is the sum of two dice (2..12), with two
  // nearby wrong numbers as distractors.
  function sumOptions(correct: number): Option[] {
    const pool: number[] = [];
    for (let n = 2; n <= 12; n++) if (n !== correct) pool.push(n);
    const others = shuffle(pool).slice(0, 2);
    return shuffle([correct, ...others]).map((n) => ({
      id: `sum-${n}`,
      kind: 'number',
      num: n,
      correct: n === correct,
    }));
  }

  function chooseMode(m: Mode) {
    if (phase === 'rolling') return;
    setMode(m);
    setPhase('idle');
    setOptions([]);
    setStars(0);
    setLocked(false);
    setDisplay({ v: 0, c: DICE_COLORS[0] });
    setDisplay2({ v: 0, c: DICE_COLORS[1] });
    setPrompt(m === 'challenge' ? 'Add two dice! Tap to roll.' : 'Tap the big button to roll!');
  }

  function roll() {
    haptic('light');
    play('roll');
    setPhase('rolling');
    setStars(0);
    setOptions([]);
    setLocked(false);
    setPrompt('Rolling…');

    rotate.setValue(0);
    Animated.timing(rotate, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const two = mode === 'challenge';
    const iv = setInterval(() => {
      setDisplay({ v: 1 + rint(6), c: pick(DICE_COLORS) });
      if (two) setDisplay2({ v: 1 + rint(6), c: pick(DICE_COLORS) });
    }, 80);
    later(() => {
      clearInterval(iv);
      const v = 1 + rint(6);
      const c = pick(DICE_COLORS);
      setValue(v);
      setColor(c);
      setDisplay({ v, c });
      let v2 = 0;
      if (two) {
        v2 = 1 + rint(6);
        setValue2(v2);
        setDisplay2({ v: v2, c: pick(DICE_COLORS) });
      }
      popScale.setValue(0.6);
      Animated.spring(popScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
      later(() => (two ? askSum(v, v2) : askCount(v)), 360);
    }, 720);
  }

  function askCount(v: number) {
    setPhase('count');
    setLocked(false);
    setPrompt('How many dots?');
    setOptions(numberOptions(v, 'number'));
  }
  function askWord() {
    setPhase('word');
    setLocked(false);
    setPrompt(`Which word says ${value}?`);
    setOptions(numberOptions(value, 'word'));
  }
  function askColor() {
    setPhase('color');
    setLocked(false);
    setPrompt('What color is the dice?');
    setOptions(colorOptions(color));
  }
  function askSum(a: number, b: number) {
    setPhase('sum');
    setLocked(false);
    setPrompt(`Add them up!  ${a} + ${b} = ?`);
    setOptions(sumOptions(a + b));
  }

  function finishRound() {
    setPhase('done');
    setOptions([]);
    setPrompt('Woohoo! Great job!');
    play('win');
    haptic('success');
    setCelebrate(true);
    setStickers((prev) => {
      const next = [...prev, pick(STICKERS)];
      persist(next);
      return next;
    });
    later(() => setCelebrate(false), 1900);
  }

  function onPick(opt: Option): boolean {
    if (locked) return true;
    if (!opt.correct) {
      play('wrong');
      haptic('warning');
      return false;
    }
    play('correct');
    haptic('success');
    setStars((s) => Math.min(3, s + 1));
    setLocked(true);
    if (phase === 'count') {
      setPrompt(`Yes! ${value} dots.`);
      later(askWord, 1050);
    } else if (phase === 'word') {
      setPrompt(`Yes! That says “${NUMBER_WORDS[value]}”.`);
      later(askColor, 1050);
    } else if (phase === 'color') {
      setPrompt(`Yes! ${color.name}!`);
      later(finishRound, 650);
    } else if (phase === 'sum') {
      setStars(3); // adding two dice is the whole round — award all the stars
      setPrompt(`Yes! ${value} + ${value2} = ${value + value2}.`);
      later(finishRound, 850);
    }
    return true;
  }

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const showRoll = phase === 'idle' || phase === 'done';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Roll & learn</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🏅 {stickers.length}</Text>
        </View>
      </View>

      <View style={styles.main}>
        <Text style={styles.prompt}>{prompt}</Text>

        <Animated.View style={{ transform: [{ rotate: spin }, { scale: popScale }] }}>
          {mode === 'challenge' ? (
            <View style={styles.diceRow}>
              <Dice value={display.v} color={display.c} size={110} />
              <Text style={styles.plusSign}>+</Text>
              <Dice value={display2.v} color={display2.c} size={110} />
            </View>
          ) : (
            <Dice value={display.v} color={display.c} size={148} />
          )}
        </Animated.View>

        <View style={styles.starsRow}>
          {[0, 1, 2].map((i) => (
            <Text key={i} style={[styles.starGlyph, { opacity: i < stars ? 1 : 0.22 }]}>
              ⭐
            </Text>
          ))}
        </View>

        <View style={styles.optsRow}>
          {options.map((opt) => (
            <OptionButton key={opt.id} opt={opt} disabled={locked} revealed={locked} onPress={onPick} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {showRoll ? (
          <>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => chooseMode('simple')}
                style={[styles.modeBtn, mode === 'simple' && styles.modeBtnOn]}
              >
                <Text style={[styles.modeText, mode === 'simple' && styles.modeTextOn]}>🎲 Count</Text>
              </Pressable>
              <Pressable
                onPress={() => chooseMode('challenge')}
                style={[styles.modeBtn, mode === 'challenge' && styles.modeBtnOn]}
              >
                <Text style={[styles.modeText, mode === 'challenge' && styles.modeTextOn]}>➕ Add two</Text>
              </Pressable>
            </View>
            <Pressable style={({ pressed }) => [styles.rollBtn, pressed && { opacity: 0.88 }]} onPress={roll}>
              <Text style={styles.rollBtnText}>{phase === 'done' ? 'Roll again!' : 'Roll the dice!'}</Text>
            </Pressable>
          </>
        ) : (
          <View style={{ height: 60 }} />
        )}

        <Text style={styles.shelfLabel}>My stickers</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelf}
        >
          {stickers.length === 0 ? (
            <Text style={styles.shelfEmpty}>Finish a round to earn a sticker!</Text>
          ) : (
            stickers.slice(-40).map((s, i) => (
              <Text key={i} style={styles.shelfSticker}>
                {s}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {celebrate ? <Confetti /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG, paddingTop: topPad },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  badge: { backgroundColor: '#FFF3D6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 16, fontWeight: '700', color: '#8A5A00' },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 14 },
  prompt: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
    minHeight: 60,
    paddingHorizontal: 10,
  },
  starsRow: { flexDirection: 'row', gap: 10, height: 34 },
  starGlyph: { fontSize: 28 },
  optsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    minHeight: 84,
  },
  opt: {
    minWidth: 88,
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: CARD_BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optCorrect: { borderColor: '#22C55E', backgroundColor: '#EAFBF0' },
  optNum: { fontSize: 34, fontWeight: '800', color: TEXT_DARK },
  optWord: { fontSize: 26, fontWeight: '800', color: TEXT_DARK },
  diceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plusSign: { fontSize: 40, fontWeight: '800', color: TEXT_DARK, marginHorizontal: 2 },
  footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 6 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 4 },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CARD_BORDER,
    backgroundColor: '#FFFFFF',
  },
  modeBtnOn: { borderColor: '#22C55E', backgroundColor: '#EAFBF0' },
  modeText: { fontSize: 15, fontWeight: '700', color: TEXT_SOFT },
  modeTextOn: { color: '#1B8A4B' },
  rollBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 3,
  },
  rollBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  shelfLabel: { fontSize: 13, fontWeight: '700', color: TEXT_SOFT, marginTop: 6, marginLeft: 4 },
  shelf: { alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4, minHeight: 40 },
  shelfSticker: { fontSize: 26 },
  shelfEmpty: { fontSize: 13, color: TEXT_SOFT, fontStyle: 'italic' },
});
