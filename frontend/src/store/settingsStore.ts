import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  theme: ThemeMode;
  language: 'ru' | 'en';
  dateFormat: string;
  numberFormat: string;
  pageSize: number;
  savedFilters: Record<string, unknown>;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lng: 'ru' | 'en') => void;
  updateSettings: (payload: Partial<Omit<SettingsState, 'setTheme' | 'toggleTheme' | 'setLanguage' | 'updateSettings'>>) => void;
  setSavedFilter: (key: string, value: unknown) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ru',
      dateFormat: 'dd.MM.yyyy',
      numberFormat: '1 234,56',
      pageSize: 20,
      savedFilters: {},
      setTheme: (theme) => set(() => ({ theme })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set(() => ({ language })),
      updateSettings: (payload) =>
        set((state) => ({
          ...state,
          ...payload,
        })),
      setSavedFilter: (key, value) =>
        set((state) => ({
          savedFilters: {
            ...state.savedFilters,
            [key]: value,
          },
        })),
    }),
    {
      name: 'ritual-settings',
    },
  ),
);

