function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const holidays = [
    { month: 1, day: 1 },
    { month: 1, day: 6 },
    { month: 5, day: 1 },
    { month: 5, day: 8 },
    { month: 7, day: 5 },
    { month: 8, day: 29 },
    { month: 9, day: 1 },
    { month: 9, day: 15 },
    { month: 11, day: 1 },
    { month: 11, day: 17 },
    { month: 12, day: 24 },
    { month: 12, day: 25 },
    { month: 12, day: 26 }
  ];
  return holidays.some(h => h.month === month && h.day === day);
}

module.exports = { isWeekend, isHoliday };


