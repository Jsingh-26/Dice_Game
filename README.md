# Roll & Learn

A simple, colorful dice game for young children (built for a 5‑year‑old). Each
round, the child rolls the dice and answers three quick questions about it:

1. **Count** the dots and tap the number.
2. Tap the matching **number word** (`one`, `two`, `three`, …).
3. Tap the **color** of the dice.

Correct taps earn stars, finished rounds earn collectible stickers (saved on the
device), and there are sounds, gentle haptics, and a confetti celebration. Wrong
taps are forgiving — a soft "try again," never a harsh buzzer.

Built with **Expo (SDK 56)** + **React Native 0.85** + **React 19** + **TypeScript**.

## A note on Expo Go (read this first)

The app targets **Expo SDK 56**. The **Expo Go** app from the App Store / Play
Store only tracks the *latest* SDK Expo has shipped through the stores, and it
currently lags behind 56 — so opening this project in store Expo Go shows
*"Project is incompatible with this version of Expo Go."* Downgrading the SDK
does **not** help (Expo Go drops support for older SDKs too).

The fix is a **development build** — a small custom version of Expo Go with this
project's SDK 56 runtime baked in. You install it once, then get the normal
scan-the-QR + live-reload workflow. See below.

## Run it (live preview with a development build)

```bash
npm install

# 1. One-time: build a dev-client APK in the cloud (free Expo account needed)
npm install -g eas-cli
eas login
eas build -p android --profile development   # see eas.json -> build.development

# 2. Install the resulting .apk on your Android phone (link is printed when done)

# 3. Start the dev server and scan the QR with the dev client (NOT store Expo Go)
npx expo start --dev-client --tunnel
```

`--tunnel` routes through ngrok (already a dev dependency), so it works even when
the phone and machine aren't on the same network — including from a cloud
machine. You can also run on an emulator with `npm run android`.

## Develop in the cloud (no local setup)

This repo ships a [`.devcontainer`](./.devcontainer/devcontainer.json), so it
opens ready-to-run in **GitHub Codespaces** (Node 20 + `eas-cli` preinstalled):

1. On GitHub: **Code ▸ Codespaces ▸ Create codespace**.
2. In the Codespace terminal: `npx expo start --dev-client --tunnel`.
3. Scan the QR from the dev client on your phone — the bundler runs in the cloud.

## Build an installable APK (the finished game)

For a standalone app you can just hand to a device — no dev server, no Expo Go:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # produces a directly-installable .apk
```

The `preview` profile in [`eas.json`](./eas.json) is configured to output an APK
(rather than an AAB) so it can be installed straight onto a device. This is the
recommended way to put the game on a child's tablet/phone.

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
