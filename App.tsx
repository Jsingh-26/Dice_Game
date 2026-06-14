import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { initSounds } from './src/sounds';
import GameScreen from './src/GameScreen';

export default function App() {
  useEffect(() => {
    initSounds();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <GameScreen />
    </>
  );
}
