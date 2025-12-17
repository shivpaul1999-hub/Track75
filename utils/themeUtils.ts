
interface ColorPalette {
    primary: string;
    hover: string;
    light: string;
    focus: string;
}

export function applyTheme(color: string, accentColor?: string) {
    const palette = generatePalette(color);
    const root = document.documentElement;
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-hover', palette.hover);
    root.style.setProperty('--color-primary-light', palette.light);
    root.style.setProperty('--color-primary-focus', palette.focus);

    if (accentColor) {
        root.style.setProperty('--color-accent', accentColor);
    } else {
        root.style.removeProperty('--color-accent');
    }
}

export function applyDarkMode(isDark: boolean) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function generatePalette(hex: string): ColorPalette {
    // Simple logic to generate variations. Use a library like 'tinycolor2' in real app.
    // Here we will use simple manipulation or just keep it basic.
    // For now, let's implement a basic adjustable function.

    return {
        primary: hex,
        hover: adjustBrightness(hex, -20),
        light: adjustBrightness(hex, 180), // actually mixing with white
        focus: hexToRgba(hex, 0.5)
    };
}

// Helpers
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, amount: number): string {
    // Amount: positive to lighten, negative to darken (roughly)
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Naive adjustment
    if (amount > 100) {
        // Special "tint" logic for 'light' variant (mix with white)
        r = Math.min(255, r + (255 - r) * 0.85);
        g = Math.min(255, g + (255 - g) * 0.85);
        b = Math.min(255, b + (255 - b) * 0.85);
    } else {
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
    }

    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
