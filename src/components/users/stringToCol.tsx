import { DEFAULT_THEME } from "@mantine/core";

const colors = DEFAULT_THEME.colors;
const colorList = Object.keys(colors);

export const numToColor = (num: number) => {
  const n = num * 157; // "large" prime
  return colorList[n % colorList.length];
};
