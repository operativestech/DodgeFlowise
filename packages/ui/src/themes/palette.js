/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */

export default function themePalette(theme) {
    // Octobot brand colors
    const octobotColors = {
        // Primary colors
        hotPink: '#E91E63',
        midPurple: '#B039D3',
        bluePurple: '#4527A0',

        // Variations
        hotPinkLight: '#F48FB1',
        hotPinkDark: '#C2185B',
        bluePurpleLight: '#7E57C2',
        bluePurpleDark: '#311B92',

        // Gradient colors
        gradientStart: '#E91E63',
        gradientMid: '#B039D3',
        gradientEnd: '#4527A0',

        // Neutrals
        white: '#FFFFFF',
        lightGray: '#F5F5F5',
        gray50: '#FAFAFA',
        gray100: '#F5F5F5',
        gray200: '#EEEEEE',
        gray300: '#E0E0E0',
        gray500: '#9E9E9E',
        gray600: '#757575',
        gray700: '#616161',
        gray900: '#212121'
    }

    return {
        mode: theme?.customization?.navType,
        transparent: theme.colors?.transparent || 'transparent',
        common: {
            black: theme.colors?.darkPaper || '#1A1A1A',
            dark: octobotColors.bluePurple,
            white: octobotColors.white
        },
        primary: {
            light: theme.customization.isDarkMode ? octobotColors.hotPinkLight : octobotColors.hotPinkLight,
            main: octobotColors.hotPink,
            dark: theme.customization.isDarkMode ? octobotColors.hotPinkDark : octobotColors.hotPinkDark,
            200: theme.customization.isDarkMode ? '#F06292' : '#F8BBD0',
            800: theme.customization.isDarkMode ? '#AD1457' : '#E91E63'
        },
        secondary: {
            light: theme.customization.isDarkMode ? octobotColors.bluePurpleLight : octobotColors.bluePurpleLight,
            main: theme.customization.isDarkMode ? octobotColors.midPurple : octobotColors.bluePurple,
            dark: theme.customization.isDarkMode ? octobotColors.bluePurpleDark : octobotColors.bluePurpleDark,
            200: '#B39DDB',
            800: '#4527A0'
        },
        error: {
            light: '#EF5350',
            main: '#F44336',
            dark: '#C62828'
        },
        orange: {
            light: '#FFB74D',
            main: '#FF9800',
            dark: '#F57C00'
        },
        teal: {
            light: '#4DB6AC',
            main: '#009688',
            dark: '#00796B'
        },
        warning: {
            light: '#FFD54F',
            main: '#FFC107',
            dark: '#F57F17'
        },
        success: {
            light: '#81C784',
            200: '#A5D6A7',
            main: '#4CAF50',
            dark: '#388E3C'
        },
        grey: {
            50: octobotColors.gray50,
            100: octobotColors.gray100,
            200: octobotColors.gray200,
            300: octobotColors.gray300,
            500: theme.darkTextSecondary || octobotColors.gray500,
            600: theme.heading || octobotColors.gray600,
            700: theme.darkTextPrimary || octobotColors.gray700,
            900: theme.textDark || octobotColors.gray900
        },
        dark: {
            light: theme.colors?.darkTextPrimary || octobotColors.white,
            main: theme.colors?.darkLevel1 || '#2C2C2C',
            dark: theme.colors?.darkLevel2 || '#1A1A1A',
            800: theme.colors?.darkBackground || '#141414',
            900: theme.colors?.darkPaper || '#0A0A0A'
        },
        text: {
            primary: theme.darkTextPrimary || (theme.customization.isDarkMode ? octobotColors.white : octobotColors.gray900),
            secondary: theme.darkTextSecondary || (theme.customization.isDarkMode ? '#E0E0E0' : octobotColors.gray600),
            dark: theme.textDark || octobotColors.gray900,
            hint: theme.colors?.grey100 || (theme.customization.isDarkMode ? '#BDBDBD' : octobotColors.gray500)
        },
        background: {
            paper: theme.paper || (theme.customization.isDarkMode ? '#1E1E1E' : octobotColors.white),
            default: theme.backgroundDefault || (theme.customization.isDarkMode ? '#121212' : octobotColors.lightGray)
        },
        textBackground: {
            main: theme.customization.isDarkMode ? 'rgba(69, 39, 160, 0.08)' : octobotColors.gray50,
            border: theme.customization.isDarkMode ? 'transparent' : octobotColors.gray300
        },
        card: {
            main: theme.customization.isDarkMode ? '#2C2C2C' : octobotColors.white,
            light: theme.customization.isDarkMode ? '#3C3C3C' : octobotColors.white,
            hover: theme.customization.isDarkMode ? 'rgba(233, 30, 99, 0.08)' : 'rgba(233, 30, 99, 0.04)'
        },
        asyncSelect: {
            main: theme.customization.isDarkMode ? 'rgba(69, 39, 160, 0.12)' : octobotColors.gray50
        },
        timeMessage: {
            main: theme.customization.isDarkMode ? '#2C2C2C' : octobotColors.gray200
        },
        canvasHeader: {
            deployLight: octobotColors.hotPinkLight,
            deployDark: octobotColors.hotPinkDark,
            saveLight: octobotColors.bluePurpleLight,
            saveDark: octobotColors.bluePurpleDark,
            settingsLight: octobotColors.gray300,
            settingsDark: octobotColors.gray700
        },
        codeEditor: {
            main: theme.customization.isDarkMode ? 'rgba(233, 30, 99, 0.12)' : 'rgba(233, 30, 99, 0.08)'
        },
        nodeToolTip: {
            background: theme.customization.isDarkMode ? '#2C2C2C' : octobotColors.white,
            color: theme.customization.isDarkMode ? octobotColors.white : 'rgba(0, 0, 0, 0.87)'
        },
        // Custom gradient for special UI elements
        gradient: {
            primary: `linear-gradient(180deg, ${octobotColors.gradientStart} 0%, ${octobotColors.gradientMid} 50%, ${octobotColors.gradientEnd} 100%)`
        },
        // Table specific colors
        table: {
            header: theme.customization.isDarkMode ? octobotColors.white : octobotColors.gray900,
            headerSecondary: theme.customization.isDarkMode ? '#E0E0E0' : octobotColors.gray600
        }
    }
}
