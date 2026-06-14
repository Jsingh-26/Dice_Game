export type DiceColor = { key: string; name: string; hex: string; pip: string };

// Each dice color is a bold, easily-named hue. `pip` is the dot color,
// chosen for strong contrast against the face (dark dots on yellow).
export const DICE_COLORS: DiceColor[] = [
  { key: 'red', name: 'Red', hex: '#EF4444', pip: '#FFFFFF' },
  { key: 'blue', name: 'Blue', hex: '#3B82F6', pip: '#FFFFFF' },
  { key: 'green', name: 'Green', hex: '#22C55E', pip: '#FFFFFF' },
  { key: 'yellow', name: 'Yellow', hex: '#FACC15', pip: '#3A2E1F' },
  { key: 'purple', name: 'Purple', hex: '#A855F7', pip: '#FFFFFF' },
  { key: 'orange', name: 'Orange', hex: '#FB923C', pip: '#FFFFFF' },
];

export const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six'];

// Which of the 9 cells (3x3 grid, index 0..8) hold a dot for each value.
export const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Fun stickers awarded after each completed round.
export const STICKERS = ['⭐', '🎉', '🦄', '🐶', '🌈', '🍭', '🚀', '🐱', '🎈', '🍎', '🦊', '🐢', '🐸', '🌟', '🍀'];

// Neutral screen background — keeps every colored dice clearly visible
// (this is the fix for the old "dice color == background color" problem).
export const SCREEN_BG = '#FFFDF7';
export const TEXT_DARK = '#3A2E1F';
export const TEXT_SOFT = '#7A6A55';
export const CARD_BORDER = '#E7DDC7';
