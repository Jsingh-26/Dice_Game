import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions, Easing } from 'react-native';

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#FB923C', '#EC4899'];
const { width, height } = Dimensions.get('window');

function Piece({ delay }: { delay: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = useRef(Math.random() * width).current;
  const color = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]).current;
  const size = useRef(8 + Math.random() * 8).current;
  const drift = useRef((Math.random() - 0.5) * 140).current;
  const spin = useRef(Math.random() * 720).current;

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration: 1500 + Math.random() * 700,
      delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-30, height] });
  const translateX = fall.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] });
  const opacity = fall.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: size,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity,
      }}
    />
  );
}

export function Confetti({ count = 30 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} delay={Math.random() * 250} />
      ))}
    </View>
  );
}
