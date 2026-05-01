import { useEffect, useState } from 'react'

const VALID_THEMES = ['dark', 'light']
const readTheme = () => {
  const stored = localStorage.getItem('theme')
  return VALID_THEMES.includes(stored) ? stored : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
