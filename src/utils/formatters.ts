// Formátovanie meny
export const formatCurrency = (amount: number | null | undefined, currency: string = 'EUR'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Formátovanie dátumu
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  return new Intl.DateTimeFormat('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

// Formátovanie čísla
export const formatNumber = (number: number | null | undefined): string => {
  if (number === null || number === undefined || isNaN(number)) return '-';
  
  return new Intl.NumberFormat('sk-SK').format(number);
};

// Formátovanie percent
export const formatPercent = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  
  return `${value.toFixed(decimals)}%`;
};
