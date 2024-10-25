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
