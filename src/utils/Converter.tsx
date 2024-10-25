/**
 * @deprecated
 * @param cents
 * @returns
 */
export const intToEur = (cents: number) => {
  return cents / 10;
};

/**
 * @deprecated
 * @param ordered
 * @returns
 */
export const pivoCena = (ordered: number) => {
  const gajbaPrice = 30;
  const pivoPrice = 1.5;
  let owed = 0;
  const numGajb = Math.floor(ordered / 24);
  owed += numGajb * gajbaPrice;
  ordered -= numGajb * 24;
  owed += ordered * pivoPrice;

  return owed;
};

/**
 * @deprecated
 * @param ordered
 * @param paid
 * @returns
 */
export const pivoVGajba = (ordered: number, paid: number) => {
  const gajbaPrice = 30;
  const pivoPrice = 1.5;
  let owed = 0;
  const numGajb = Math.floor(ordered / 24);
  owed += numGajb * gajbaPrice;
  ordered -= numGajb * 24;
  owed += ordered * pivoPrice;

  return owed - paid;
};

export const formatCurrency = (num: number) => {
  const euro = Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
  });
  // format number to eur on two decimals
  return euro.format(num);
};

export const getDateFromString = (date: string) => {
  const dParsed = Date.parse(date);
  const d = new Date(dParsed);
  return [d.toLocaleTimeString(), d.toLocaleDateString()];
};
