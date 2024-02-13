export const intToEur = (cents: number) => {
  return cents / 10;
};

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

// export const computeDebt = (ordered: number, paid: number) => {
//   return ordered * 1.5 - paid / 100.0;
// };

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

export const numberToEur = (num: number) => {
  // format number to eur on two decimals
  return (num * -1).toFixed(2);
};

export const getDateFromString = (date: string) => {
  const dParsed = Date.parse(date);
  const d = new Date(dParsed);
  return [d.toLocaleTimeString(), d.toLocaleDateString()];
};
