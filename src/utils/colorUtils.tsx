import { DEFAULT_THEME } from '@mantine/core';

const colors = DEFAULT_THEME.colors;
const colorList = Object.keys(colors);

export const numToColor = (num: number) => {
  const n = num * 157; // "large" prime
  return colorList[n % colorList.length];
};

export const stringToColor = (str: string): string => {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a number between 0 and 1
  const normalizedNum = Math.abs(hash) / Math.pow(2, 31);

  // Use your existing numToColor function
  return numToColor(normalizedNum);
};
