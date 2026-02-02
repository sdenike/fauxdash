export interface Theme {
  name: string
  colors: {
    // Base colors
    background: string
    foreground: string

    // Card colors
    card: string
    cardForeground: string

    // Popover colors
    popover: string
    popoverForeground: string

    // Primary colors
    primary: string
    primaryForeground: string

    // Secondary colors
    secondary: string
    secondaryForeground: string

    // Muted colors
    muted: string
    mutedForeground: string

    // Accent colors
    accent: string
    accentForeground: string

    // Destructive colors
    destructive: string
    destructiveForeground: string

    // Border and input
    border: string
    input: string
    ring: string

    // Radius
    radius: string
  }
}

export const THEMES: Theme[] = [
  {
    name: 'Slate',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '222.2 84% 4.9%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Blue',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Green',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '142.1 76.2% 36.3%',
      primaryForeground: '355.7 100% 97.3%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '142.1 76.2% 36.3%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Orange',
    colors: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      cardForeground: '20 14.3% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '20 14.3% 4.1%',
      primary: '24.6 95% 53.1%',
      primaryForeground: '60 9.1% 97.8%',
      secondary: '60 4.8% 95.9%',
      secondaryForeground: '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      mutedForeground: '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      accentForeground: '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '24.6 95% 53.1%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Rose',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '346.8 77.2% 49.8%',
      primaryForeground: '355.7 100% 97.3%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '346.8 77.2% 49.8%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Purple',
    colors: {
      background: '0 0% 100%',
      foreground: '224 71.4% 4.1%',
      card: '0 0% 100%',
      cardForeground: '224 71.4% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '224 71.4% 4.1%',
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '210 20% 98%',
      secondary: '220 14.3% 95.9%',
      secondaryForeground: '220.9 39.3% 11%',
      muted: '220 14.3% 95.9%',
      mutedForeground: '220 8.9% 46.1%',
      accent: '220 14.3% 95.9%',
      accentForeground: '220.9 39.3% 11%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 20% 98%',
      border: '220 13% 91%',
      input: '220 13% 91%',
      ring: '262.1 83.3% 57.8%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Violet',
    colors: {
      background: '0 0% 100%',
      foreground: '224 71.4% 4.1%',
      card: '0 0% 100%',
      cardForeground: '224 71.4% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '224 71.4% 4.1%',
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '210 20% 98%',
      secondary: '220 14.3% 95.9%',
      secondaryForeground: '220.9 39.3% 11%',
      muted: '220 14.3% 95.9%',
      mutedForeground: '220 8.9% 46.1%',
      accent: '220 14.3% 95.9%',
      accentForeground: '220.9 39.3% 11%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 20% 98%',
      border: '220 13% 91%',
      input: '220 13% 91%',
      ring: '262.1 83.3% 57.8%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Yellow',
    colors: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      cardForeground: '20 14.3% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '20 14.3% 4.1%',
      primary: '47.9 95.8% 53.1%',
      primaryForeground: '26 83.3% 14.1%',
      secondary: '60 4.8% 95.9%',
      secondaryForeground: '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      mutedForeground: '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      accentForeground: '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '20 14.3% 4.1%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Red',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      card: '0 0% 100%',
      cardForeground: '0 0% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 3.9%',
      primary: '0 72.2% 50.6%',
      primaryForeground: '0 85.7% 97.3%',
      secondary: '0 0% 96.1%',
      secondaryForeground: '0 0% 9%',
      muted: '0 0% 96.1%',
      mutedForeground: '0 0% 45.1%',
      accent: '0 0% 96.1%',
      accentForeground: '0 0% 9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 89.8%',
      input: '0 0% 89.8%',
      ring: '0 72.2% 50.6%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Zinc',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '240 5.9% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 10% 3.9%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Neutral',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      card: '0 0% 100%',
      cardForeground: '0 0% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 3.9%',
      primary: '0 0% 9%',
      primaryForeground: '0 0% 98%',
      secondary: '0 0% 96.1%',
      secondaryForeground: '0 0% 9%',
      muted: '0 0% 96.1%',
      mutedForeground: '0 0% 45.1%',
      accent: '0 0% 96.1%',
      accentForeground: '0 0% 9%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 89.8%',
      input: '0 0% 89.8%',
      ring: '0 0% 3.9%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Stone',
    colors: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      cardForeground: '20 14.3% 4.1%',
      popover: '0 0% 100%',
      popoverForeground: '20 14.3% 4.1%',
      primary: '24 9.8% 10%',
      primaryForeground: '60 9.1% 97.8%',
      secondary: '60 4.8% 95.9%',
      secondaryForeground: '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      mutedForeground: '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      accentForeground: '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '20 14.3% 4.1%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Emerald',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '160 84.1% 39.4%',
      primaryForeground: '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '160 84.1% 39.4%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Teal',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '173 80.4% 40%',
      primaryForeground: '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '173 80.4% 40%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Cyan',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '189 94.5% 42.7%',
      primaryForeground: '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '189 94.5% 42.7%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Sky',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '199 89.1% 48%',
      primaryForeground: '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '199 89.1% 48%',
      radius: '0.5rem',
    },
  },
  {
    name: 'White',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 5%',
      card: '0 0% 98%',
      cardForeground: '0 0% 5%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 5%',
      primary: '0 0% 10%',
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 97%',
      secondaryForeground: '0 0% 10%',
      muted: '0 0% 95%',
      mutedForeground: '0 0% 40%',
      accent: '0 0% 95%',
      accentForeground: '0 0% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '0 0% 10%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Gray',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 10%',
      card: '0 0% 100%',
      cardForeground: '0 0% 10%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 10%',
      primary: '0 0% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 96%',
      secondaryForeground: '0 0% 10%',
      muted: '0 0% 94%',
      mutedForeground: '0 0% 40%',
      accent: '0 0% 94%',
      accentForeground: '0 0% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 88%',
      input: '0 0% 88%',
      ring: '0 0% 45%',
      radius: '0.5rem',
    },
  },
]

// Standalone dark themes (not dependent on light/dark mode toggle)
export const STANDALONE_THEMES: Theme[] = [
  {
    name: 'Nord Light',
    colors: {
      background: '219 28% 94%', // #eceff4
      foreground: '220 16% 22%', // #2e3440
      card: '218 27% 92%', // #e5e9f0
      cardForeground: '220 16% 22%',
      popover: '218 27% 92%',
      popoverForeground: '220 16% 22%',
      primary: '193 43% 67%', // #88c0d0 (Frost)
      primaryForeground: '220 16% 22%',
      secondary: '218 27% 88%',
      secondaryForeground: '220 16% 22%',
      muted: '218 27% 88%',
      mutedForeground: '220 16% 36%',
      accent: '193 43% 67%',
      accentForeground: '220 16% 22%',
      destructive: '354 42% 56%', // #bf616a
      destructiveForeground: '219 28% 94%',
      border: '220 17% 78%',
      input: '220 17% 78%',
      ring: '193 43% 67%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Nord Dark',
    colors: {
      background: '220 16% 22%', // #2e3440
      foreground: '219 28% 88%', // #d8dee9
      card: '220 17% 20%', // #3b4252
      cardForeground: '219 28% 88%',
      popover: '220 17% 20%',
      popoverForeground: '219 28% 88%',
      primary: '193 43% 67%', // #88c0d0 (Frost)
      primaryForeground: '220 16% 22%',
      secondary: '220 16% 28%',
      secondaryForeground: '219 28% 88%',
      muted: '220 16% 28%',
      mutedForeground: '219 28% 66%',
      accent: '193 43% 67%',
      accentForeground: '220 16% 22%',
      destructive: '354 42% 56%', // #bf616a
      destructiveForeground: '219 28% 88%',
      border: '220 17% 32%',
      input: '220 17% 32%',
      ring: '193 43% 67%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Material Dark',
    colors: {
      background: '0 0% 7%', // #121212
      foreground: '0 0% 87%', // #dedede
      card: '0 0% 10%', // #1a1a1a
      cardForeground: '0 0% 87%',
      popover: '0 0% 10%',
      popoverForeground: '0 0% 87%',
      primary: '207 90% 54%', // #2196F3 (Blue)
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 14%',
      secondaryForeground: '0 0% 87%',
      muted: '0 0% 14%',
      mutedForeground: '0 0% 60%',
      accent: '207 90% 54%',
      accentForeground: '0 0% 100%',
      destructive: '4 90% 58%', // #f44336
      destructiveForeground: '0 0% 100%',
      border: '0 0% 18%',
      input: '0 0% 18%',
      ring: '207 90% 54%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Minimal Kiwi',
    colors: {
      background: '0 0% 13%', // #212121
      foreground: '0 0% 87%',
      card: '0 0% 16%',
      cardForeground: '0 0% 87%',
      popover: '0 0% 16%',
      popoverForeground: '0 0% 87%',
      primary: '100 51% 60%', // #82cd64 (Green)
      primaryForeground: '0 0% 13%',
      secondary: '0 0% 20%',
      secondaryForeground: '0 0% 87%',
      muted: '0 0% 20%',
      mutedForeground: '0 0% 55%',
      accent: '100 51% 60%',
      accentForeground: '0 0% 13%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '0 0% 24%',
      input: '0 0% 24%',
      ring: '100 51% 60%',
      radius: '0.5rem',
    },
  },
  {
    name: 'One Dark Pro',
    colors: {
      background: '220 13% 18%', // #282c34
      foreground: '219 14% 76%', // #abb2bf
      card: '220 13% 21%',
      cardForeground: '219 14% 76%',
      popover: '220 13% 21%',
      popoverForeground: '219 14% 76%',
      primary: '207 82% 66%', // #61afef (Blue)
      primaryForeground: '220 13% 18%',
      secondary: '220 13% 26%',
      secondaryForeground: '219 14% 76%',
      muted: '220 13% 26%',
      mutedForeground: '219 10% 53%',
      accent: '207 82% 66%',
      accentForeground: '220 13% 18%',
      destructive: '355 65% 65%', // #e06c75
      destructiveForeground: '220 13% 18%',
      border: '220 13% 28%',
      input: '220 13% 28%',
      ring: '207 82% 66%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Catppuccin Mocha',
    colors: {
      background: '240 21% 15%', // #1e1e2e
      foreground: '226 64% 88%', // #cdd6f4
      card: '240 21% 17%', // #313244
      cardForeground: '226 64% 88%',
      popover: '240 21% 17%',
      popoverForeground: '226 64% 88%',
      primary: '267 84% 81%', // #cba6f7 (Mauve)
      primaryForeground: '240 21% 15%',
      secondary: '240 21% 20%',
      secondaryForeground: '226 64% 88%',
      muted: '240 21% 20%',
      mutedForeground: '228 24% 72%',
      accent: '267 84% 81%',
      accentForeground: '240 21% 15%',
      destructive: '343 81% 75%', // #f38ba8
      destructiveForeground: '240 21% 15%',
      border: '240 21% 24%',
      input: '240 21% 24%',
      ring: '267 84% 81%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Shades of Purple',
    colors: {
      background: '248 36% 25%', // #2D2A56
      foreground: '252 68% 90%', // #d6cefc
      card: '248 36% 28%',
      cardForeground: '252 68% 90%',
      popover: '248 36% 28%',
      popoverForeground: '252 68% 90%',
      primary: '265 89% 78%', // #b362ff (Purple)
      primaryForeground: '248 36% 25%',
      secondary: '248 36% 32%',
      secondaryForeground: '252 68% 90%',
      muted: '248 36% 32%',
      mutedForeground: '252 30% 65%',
      accent: '265 89% 78%',
      accentForeground: '248 36% 25%',
      destructive: '355 70% 65%',
      destructiveForeground: '248 36% 25%',
      border: '248 36% 36%',
      input: '248 36% 36%',
      ring: '265 89% 78%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Monokai Light',
    colors: {
      background: '25 9% 81%', // #d3cdcc
      foreground: '60 2% 20%',
      card: '25 9% 86%',
      cardForeground: '60 2% 20%',
      popover: '25 9% 86%',
      popoverForeground: '60 2% 20%',
      primary: '95 55% 66%', // #a9dc76 (Green)
      primaryForeground: '60 2% 20%',
      secondary: '25 9% 76%',
      secondaryForeground: '60 2% 20%',
      muted: '25 9% 76%',
      mutedForeground: '60 2% 40%',
      accent: '95 55% 66%',
      accentForeground: '60 2% 20%',
      destructive: '348 100% 70%', // #ff6188
      destructiveForeground: '60 2% 20%',
      border: '25 9% 68%',
      input: '25 9% 68%',
      ring: '95 55% 66%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Monokai Dark',
    colors: {
      background: '300 4% 10%', // #19181a
      foreground: '60 6% 88%', // #fcfcfa
      card: '300 4% 13%',
      cardForeground: '60 6% 88%',
      popover: '300 4% 13%',
      popoverForeground: '60 6% 88%',
      primary: '348 100% 70%', // #ff6188 (Pink)
      primaryForeground: '300 4% 10%',
      secondary: '300 4% 18%',
      secondaryForeground: '60 6% 88%',
      muted: '300 4% 18%',
      mutedForeground: '60 6% 60%',
      accent: '348 100% 70%',
      accentForeground: '300 4% 10%',
      destructive: '348 100% 70%',
      destructiveForeground: '60 6% 88%',
      border: '300 4% 24%',
      input: '300 4% 24%',
      ring: '348 100% 70%',
      radius: '0.5rem',
    },
  },
  {
    name: 'Dracula',
    colors: {
      background: '231 15% 18%', // #282a36
      foreground: '232 14% 88%', // #f8f8f2
      card: '231 15% 22%', // #44475a
      cardForeground: '232 14% 88%',
      popover: '231 15% 22%',
      popoverForeground: '232 14% 88%',
      primary: '265 89% 78%', // #bd93f9 (Purple)
      primaryForeground: '231 15% 18%',
      secondary: '231 15% 26%',
      secondaryForeground: '232 14% 88%',
      muted: '231 15% 26%',
      mutedForeground: '232 14% 66%',
      accent: '265 89% 78%',
      accentForeground: '231 15% 18%',
      destructive: '0 100% 67%', // #ff5555
      destructiveForeground: '232 14% 88%',
      border: '231 15% 30%',
      input: '231 15% 30%',
      ring: '265 89% 78%',
      radius: '0.5rem',
    },
  },
]

export const DARK_THEMES: Theme[] = THEMES.map((theme) => ({
  ...theme,
  name: `${theme.name} (Dark)`,
  colors: {
    // GitHub Dark Default palette as base
    background: '215 21% 7%',
    foreground: '215 14% 82%',
    card: '215 19% 11%',
    cardForeground: '215 14% 82%',
    popover: '215 19% 11%',
    popoverForeground: '215 14% 82%',
    primary: theme.colors.primary,
    primaryForeground: '215 21% 7%',
    secondary: '215 14% 15%',
    secondaryForeground: '215 14% 82%',
    muted: '215 14% 15%',
    mutedForeground: '215 11% 58%',
    accent: '215 14% 15%',
    accentForeground: '215 14% 82%',
    destructive: '3 95% 63%',
    destructiveForeground: '215 14% 82%',
    border: '215 14% 21%',
    input: '215 14% 21%',
    ring: theme.colors.ring,
    radius: theme.colors.radius,
  },
}))

export const ALL_THEMES = [...THEMES, ...DARK_THEMES, ...STANDALONE_THEMES]

export function applyTheme(theme: Theme) {
  const root = document.documentElement

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}

export function getThemeByName(name: string): Theme | undefined {
  return ALL_THEMES.find((theme) => theme.name === name)
}
