import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

export const ReadTimeFromUTCString = (timeStr: string) => {
  return dayjs.utc(timeStr);
};

export const FormatLocalDate = (date: Dayjs) => {
  return date.local().format('L'); // Uses local locale formatting
  // Or customize the format:
  // return date.local().format('YYYY-MM-DD HH:mm:ss');
};

export const FormatDateUTC = (date: Dayjs) => {
  return date.utc().format('YYYY-MM-DD HH:mm:ss [UTC]');
  // Or for ISO format:
  // return date.utc().toISOString();
};

// Additional helpers you might find useful:
export const WriteTimeToUTCString = (date: Dayjs) => {
  return date.utc().toISOString();
};

export const CreateUTCDate = (dateInput?: string | number | Date | Dayjs) => {
  return dayjs(dateInput).utc();
};

export const FormatLocalDateCustom = (date: Dayjs, format: string) => {
  return date.local().format(format);
};
