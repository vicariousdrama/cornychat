export {colors, colorThemes, isDark};

const lightColor = '#f4f4f4';
const darkColor = '#111111';

function isDark(hex) {
  if (!hex) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r + g + b < 128 * 3;
}

const colorThemes = {
  default: {
    background: '#111111',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#0066ff',
    },
    avatarBg: '#1e1e1e',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
  orange: {
    background: '#f7f7f7',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#ff592a',
    },
    avatarBg: '#3276b9',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
  cyan: {
    background: '#08242b',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#51da6a',
    },
    avatarBg: '#225567',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
  red: {
    background: '#111111',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#ba0000',
    },
    avatarBg: '#1e1e1e',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },

  blue: {
    background: '#215a88',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#ff592a',
    },
    avatarBg: '#3276b9',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
  blackGray: {
    background: '#f7f7f7',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#333333',
    },
    avatarBg: '#e5e5e5',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
};

const colors = room => {
  switch (room) {
    case 'default':
      return colorThemes.default;

    case 'blue':
      return colorThemes.blue;

    case 'red':
      return colorThemes.red;

    case 'cyan':
      return colorThemes.cyan;

    case 'orange':
      return colorThemes.orange;

    case 'blackGray':
      return colorThemes.blackGray;
  }
};
