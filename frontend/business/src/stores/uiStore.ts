import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';

export const UI_DEFAULTS = {
    sidebarCollapsed: false,
    themeMode: 'light' as ThemeMode,
    accentColor: '#0C5CCC',
    density: 'comfortable' as DensityMode,
};

interface UiState {
    sidebarCollapsed: boolean;
    themeMode: ThemeMode;
    accentColor: string;
    density: DensityMode;
    mobileNavOpen: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    setAccentColor: (color: string) => void;
    setDensity: (density: DensityMode) => void;
    setMobileNavOpen: (open: boolean) => void;
    resetPreferences: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            sidebarCollapsed: UI_DEFAULTS.sidebarCollapsed,
            themeMode: UI_DEFAULTS.themeMode,
            accentColor: UI_DEFAULTS.accentColor,
            density: 'comfortable',
            mobileNavOpen: false,
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setThemeMode: (mode) => set({ themeMode: mode }),
            setAccentColor: (color) => set({ accentColor: color }),
            setDensity: (density) => set({ density }),
            setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
            resetPreferences: () =>
                set({
                    sidebarCollapsed: UI_DEFAULTS.sidebarCollapsed,
                    themeMode: UI_DEFAULTS.themeMode,
                    accentColor: UI_DEFAULTS.accentColor,
                    density: UI_DEFAULTS.density,
                }),
        }),
        {
            name: 'ats-business-ui-preferences',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                themeMode: state.themeMode,
                accentColor: state.accentColor,
                density: state.density,
            }),
        }
    )
);
