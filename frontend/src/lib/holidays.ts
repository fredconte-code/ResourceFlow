import holidaysData from './holidays.json';

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export interface Holidays {
  campinas: Holiday[];
  montreal: Holiday[];
}

const holidays: Holidays = holidaysData;
export default holidays; 