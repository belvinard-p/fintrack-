/**
 * Chart colours taken from the theme (src/styles/globals.css), so charts follow light and dark mode like the rest of
 * the interface. A fixed dark bar colour vanished on the dark background.
 */
export const chartTheme = {
  bar: "var(--primary)",
  grid: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  tooltip: {
    contentStyle: {
      background: "var(--popover)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      color: "var(--popover-foreground)",
    },
    cursor: { fill: "var(--muted)", opacity: 0.4 },
  },
} as const;
