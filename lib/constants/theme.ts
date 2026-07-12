/**
 * Theme configuration and constants for AssetFlow
 */

export const THEME_STORAGE_KEY = "assetflow-theme";

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ThemeMode = typeof THEME_MODES[keyof typeof THEME_MODES];

export const DEFAULT_THEME: ThemeMode = THEME_MODES.LIGHT;

export const THEME_DATA = {
  [THEME_MODES.LIGHT]: {
    name: "Light Mode",
    iconName: "Sun",
    colors: {
      background: "#fbfafb",
      foreground: "#2d262b",
      card: "#ffffff",
      cardForeground: "#2d262b",
      popover: "#ffffff",
      popoverForeground: "#2d262b",
      muted: "#f4f1f3",
      mutedForeground: "#6e646a",
      accent: "#f4f1f3",
      accentForeground: "#714B67",
      border: "#e6e0e4",
      input: "#e6e0e4",
      ring: "#714B67",
    },
  },
  [THEME_MODES.DARK]: {
    name: "Dark Mode",
    iconName: "Moon",
    colors: {
      background: "#171215",
      foreground: "#f4f1f3",
      card: "#201a1d",
      cardForeground: "#f4f1f3",
      popover: "#201a1d",
      popoverForeground: "#f4f1f3",
      muted: "#2d262a",
      mutedForeground: "#a69ea3",
      accent: "#2d262a",
      accentForeground: "#f0e6ed",
      border: "#3d3439",
      input: "#3d3439",
      ring: "#8f6182",
    },
  },
} as const;
