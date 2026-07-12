/**
 * Global Style Constants for AssetFlow
 * These constants match the Odoo-inspired theme configured in app/globals.css
 */
export const THEME = {
  colors: {
    primary: "#714B67", // Odoo Purple
    primaryLight: "#8f6182",
    secondary: "#E97D5B", // Warm Orange / Peach
    teal: "#0097A7", // Teal Accent
    background: "#fbfafb",
    foreground: "#2d262b",
    border: "#e6e0e4",
    muted: "#f4f1f3",
    mutedForeground: "#6e646a",
  },
  classes: {
    // Buttons
    btnPrimary: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary btn-primary text-white cursor-pointer",
    btnSecondary: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary btn-secondary text-white cursor-pointer",
    btnOutline: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-border bg-transparent text-foreground hover:bg-muted hover:text-primary transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer",
    btnGhost: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus:outline-none cursor-pointer",

    // Card styling
    card: "bg-card text-card-foreground rounded-lg border border-border p-6 shadow-xs premium-card",
    cardHover: "premium-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200",

    // Form inputs
    input: "block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
    label: "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",

    // Layout
    container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8",
    header: "flex items-center justify-between pb-5 border-b border-border mb-6",
    title: "text-2xl font-bold tracking-tight text-foreground",
    subtitle: "text-sm text-muted-foreground mt-1",
  }
} as const;
