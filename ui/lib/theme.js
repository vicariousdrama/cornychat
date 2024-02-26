export {colors, colorThemes, isDark};

const lightColor = '#f4f4f4';
const darkColor = '#111111';

function isDark(color) {
  const hexToRgb = hex =>
    hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16));

  const parseRgba = rgba =>
    rgba
      .substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')'))
      .split(',')
      .map(val => parseFloat(val.trim()));

  let rgb;
  if (color.startsWith('#') && color.length >= 7) {
    rgb = hexToRgb(color.substring(0, 7));
  } else if (color.startsWith('rgba(')) {
    rgb = parseRgba(color);
  } else {
    console.error('Invalid color format');
    return null;
  }

  const relativeLuminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const luminance = relativeLuminance(...rgb.map(c => c / 255));

  return luminance < 0.5;
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
      primary: '#3276b9',
    },
    avatarBg: '#ff592a',
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
  corn: {
    background: '#212121',
    text: {
      light: lightColor,
      dark: darkColor,
    },
    buttons: {
      primary: '#fbed5e',
    },
    avatarBg: '#71a92c',
    icons: {
      light: lightColor,
      dark: darkColor,
    },
  },
};

const colors = (room, customColor) => {
  switch (room) {
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
    case 'corn':
      return colorThemes.corn;
    case 'customColor':
      return customColor;
    default:
      return colorThemes.default;
  }
};
