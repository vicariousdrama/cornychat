export function getColorPallete(colorThemes) {
  let paletteColors = [];
  for (const key in colorThemes) {
    paletteColors.push([key, colorThemes[key]]);
  }
  return paletteColors;
}

export function getRgbaObj(rgba) {
  const regex = /\(([^)]*)\)/;
  const match = rgba.match(regex);

  if (match) {
    const values = match[1].split(',');
    const obj = {
      a: values[3],
      b: values[2],
      g: values[1],
      r: values[0],
    };

    return obj;
  }
}

export function getCustomColor(styleBg, styleAvatar, styleButtons) {
  return {
    background: styleBg,
    text: {
      light: '#f4f4f4',
      dark: '#111111',
    },
    buttons: {
      primary: styleButtons,
    },
    avatarBg: styleAvatar,
    icons: {
      light: '#f4f4f4',
      dark: '#111111',
    },
  };
}
