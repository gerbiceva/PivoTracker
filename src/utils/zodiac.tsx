// To future developers
// Ta stuff je biu napisan with loving thoughts do punce Tine <3
// pliz ne zbrisat
// zodiac.ts
import {
  IconZodiacAries,
  IconZodiacTaurus,
  IconZodiacGemini,
  IconZodiacCancer,
  IconZodiacLeo,
  IconZodiacVirgo,
  IconZodiacLibra,
  IconZodiacScorpio,
  IconZodiacSagittarius,
  IconZodiacCapricorn,
  IconZodiacAquarius,
  IconZodiacPisces,
} from '@tabler/icons-react';
import type { Dayjs } from 'dayjs';

export enum ZodiacSign {
  ARIES = 'Aries',
  TAURUS = 'Taurus',
  GEMINI = 'Gemini',
  CANCER = 'Cancer',
  LEO = 'Leo',
  VIRGO = 'Virgo',
  LIBRA = 'Libra',
  SCORPIO = 'Scorpio',
  SAGITTARIUS = 'Sagittarius',
  CAPRICORN = 'Capricorn',
  AQUARIUS = 'Aquarius',
  PISCES = 'Pisces',
}

/* ---------- calculation ---------- */
export const getZodiacSign = (date: Dayjs): ZodiacSign | undefined => {
  const day = date.date();
  const month = date.month() + 1; // Dayjs months are 0-based

  switch (month) {
    case 1:
      return day >= 20 ? ZodiacSign.AQUARIUS : ZodiacSign.CAPRICORN;
    case 2:
      return day >= 19 ? ZodiacSign.PISCES : ZodiacSign.AQUARIUS;
    case 3:
      return day >= 21 ? ZodiacSign.ARIES : ZodiacSign.PISCES;
    case 4:
      return day >= 20 ? ZodiacSign.TAURUS : ZodiacSign.ARIES;
    case 5:
      return day >= 21 ? ZodiacSign.GEMINI : ZodiacSign.TAURUS;
    case 6:
      return day >= 21 ? ZodiacSign.CANCER : ZodiacSign.GEMINI;
    case 7:
      return day >= 23 ? ZodiacSign.LEO : ZodiacSign.CANCER;
    case 8:
      return day >= 23 ? ZodiacSign.VIRGO : ZodiacSign.LEO;
    case 9:
      return day >= 23 ? ZodiacSign.LIBRA : ZodiacSign.VIRGO;
    case 10:
      return day >= 23 ? ZodiacSign.SCORPIO : ZodiacSign.LIBRA;
    case 11:
      return day >= 22 ? ZodiacSign.SAGITTARIUS : ZodiacSign.SCORPIO;
    case 12:
      return day >= 22 ? ZodiacSign.CAPRICORN : ZodiacSign.SAGITTARIUS;
    default:
      return undefined;
  }
};

/* ---------- icon mapping ---------- */
export const zodiacToIcon = (zodiac: ZodiacSign, size?: number | string) => {
  switch (zodiac) {
    case ZodiacSign.ARIES:
      return <IconZodiacAries size={size} />;
    case ZodiacSign.TAURUS:
      return <IconZodiacTaurus size={size} />;
    case ZodiacSign.GEMINI:
      return <IconZodiacGemini size={size} />;
    case ZodiacSign.CANCER:
      return <IconZodiacCancer size={size} />;
    case ZodiacSign.LEO:
      return <IconZodiacLeo size={size} />;
    case ZodiacSign.VIRGO:
      return <IconZodiacVirgo size={size} />;
    case ZodiacSign.LIBRA:
      return <IconZodiacLibra size={size} />;
    case ZodiacSign.SCORPIO:
      return <IconZodiacScorpio size={size} />;
    case ZodiacSign.SAGITTARIUS:
      return <IconZodiacSagittarius size={size} />;
    case ZodiacSign.CAPRICORN:
      return <IconZodiacCapricorn size={size} />;
    case ZodiacSign.AQUARIUS:
      return <IconZodiacAquarius size={size} />;
    case ZodiacSign.PISCES:
      return <IconZodiacPisces size={size} />;
  }
};
