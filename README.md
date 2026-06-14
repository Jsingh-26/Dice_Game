# Roll & Learn

A simple, colorful dice game for young children (built for a 5‑year‑old). Each
round, the child rolls the dice and answers three quick questions about it:

1. **Count** the dots and tap the number.
2. Tap the matching **number word** (`one`, `two`, `three`, …).
3. Tap the **color** of the dice.

Correct taps earn stars, finished rounds earn collectible stickers (saved on the
device), and there are sounds, gentle haptics, and a confetti celebration. Wrong
taps are forgiving — a soft "try again," never a harsh buzzer.

Built with **Expo (SDK 56)** + **React Native** + **TypeScript**.

## Run it locally

```bash
npm install
npx expo start
```

Then open the project in **Expo Go** on a phone (scan the QR code), or run on an
emulator with `npm run android`.

## Build an installable APK

Uses [EAS Build](https://docs.expo.dev/build/introduction/) (cloud). You need a
free [Expo account](https://expo.dev).

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # produces a directly-installable .apk
```

The `preview` profile in [`eas.json`](./eas.json) is configured to output an APK
(rather than an AAB) so it can be installed straight onto a device.

## Sound effects

All sound effects are **synthesized** (no third‑party audio assets) by a small
script, so they're completely license‑free:

```bash
node scripts/gen-sounds.js   # regenerates assets/sounds/*.wav
```

## Project layout

| Path | What it is |
|------|------------|
| `App.tsx` | App entry — initializes audio, renders the game |
| `src/GameScreen.tsx` | Main game: round flow, scoring, stickers, animations |
| `src/Dice.tsx` | Dice face drawn from plain Views (bold color + white outline) |
| `src/Confetti.tsx` | Confetti celebration |
| `src/sounds.ts` | Loads and plays the synthesized sound effects |
| `src/colors.ts` | Dice colors, number words, pip layouts, stickers |
| `scripts/gen-sounds.js` | Generates the WAV sound effects |
