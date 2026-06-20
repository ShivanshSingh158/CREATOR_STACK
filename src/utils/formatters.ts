export const formatDateDDMMYY = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

export const formatRupee = (amount: number | string): string => {
  const num =
    typeof amount === 'string'
      ? parseFloat(amount.toString().replace(/,/g, '').replace(/₹/g, ''))
      : amount;
  if (isNaN(num)) return String(amount);
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatNumberCompact = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};
