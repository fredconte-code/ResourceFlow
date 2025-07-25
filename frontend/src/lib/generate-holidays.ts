import Holidays from 'date-holidays';
import fs from 'fs';

const years = Array.from({ length: 7 }, (_, i) => 2024 + i);

const hdBR = new Holidays('BR', 'SP'); // Campinas, SP
const hdCA = new Holidays('CA', 'QC'); // Montreal, QC

const holidays: Record<string, { date: string; name: string; type: string }[]> = {
  campinas: [],
  montreal: [],
};

years.forEach(year => {
  holidays.campinas.push(
    ...hdBR.getHolidays(year).map(h => ({ date: h.date, name: h.name, type: h.type })),
  );
  holidays.montreal.push(
    ...hdCA.getHolidays(year).map(h => ({ date: h.date, name: h.name, type: h.type })),
  );
});

fs.writeFileSync('src/lib/holidays.json', JSON.stringify(holidays, null, 2));

console.log('Holidays generated for Campinas and Montreal up to 2030.'); 