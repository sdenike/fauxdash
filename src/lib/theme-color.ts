/*
  <meta name="theme-color"> colours the title bar of the installed app (Windows, Android) and the
  browser chrome on phones. It has to follow the theme the page is actually showing, which is the
  visitor's own choice or the site default, not only the operating system's light/dark setting.

  Must match --background in globals.css (Bear "Red Graphite").
*/
export const THEME_COLORS = {
  light: '#ffffff', // palette-ok: must match --background
  dark: '#171a1c', // palette-ok: must match --background
} as const

/**
 * Blocking script for <head>: writes the meta tag before the first paint, using the same inputs as
 * next-themes (localStorage "theme", then the site default, then the system setting).
 */
export function themeColorScript(defaultTheme: 'light' | 'dark' | 'system'): string {
  return `(function(){try{var t;try{t=localStorage.getItem('theme')}catch(e){}
if(t!=='light'&&t!=='dark'&&t!=='system')t=${JSON.stringify(defaultTheme)};
if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
var m=document.createElement('meta');m.name='theme-color';
m.content=t==='dark'?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)};
document.head.appendChild(m)}catch(e){}})()`
}
