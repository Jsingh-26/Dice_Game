import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const sources = {
  roll: require('../assets/sounds/roll.wav'),
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  win: require('../assets/sounds/win.wav'),
  tap: require('../assets/sounds/tap.wav'),
};

export type SoundName = keyof typeof sources;

// Gentle, polite levels. Kept deliberately low so the game feels soft and
// calm for a young child — the "wrong" and "tap" cues are the quietest.
const VOLUMES: Record<SoundName, number> = {
  roll: 0.18,
  correct: 0.22,
  wrong: 0.12,
  win: 0.25,
  tap: 0.1,
};

let players: Record<SoundName, AudioPlayer> | null = null;

export async function initSounds() {
  try {
    // Let the game be heard even if the phone's ringer is on silent.
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {}
  if (players) return;
  const next = {} as Record<SoundName, AudioPlayer>;
  (Object.keys(sources) as SoundName[]).forEach((name) => {
    const p = createAudioPlayer(sources[name]);
    p.volume = VOLUMES[name];
    next[name] = p;
  });
  players = next;
}

export function play(name: SoundName) {
  const p = players?.[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {}
}
