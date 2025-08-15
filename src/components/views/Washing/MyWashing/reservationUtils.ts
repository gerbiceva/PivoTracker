import { ReadTimeFromUTCString } from '../../../../utils/timeUtils';
import { ReservationForUserType } from './UserReservations';
import type { Dayjs } from 'dayjs';

/**
 * Groups the reservation list by calendar month.
 * The key is a Dayjs object representing the first day of the month (UTC, hour 0).
 */
export function groupReservationsByMonth(
  data: ReservationForUserType[],
): Map<Dayjs, NonNullable<ReservationForUserType>[]> {
  const buckets = new Map<Dayjs, NonNullable<ReservationForUserType>[]>();

  if (!data) return buckets; // undefined guard

  for (const r of data) {
    const start = ReadTimeFromUTCString(r.slot_start_utc);
    // Start of the month in UTC
    const monthKey = start.startOf('month');

    // Ensure we reuse the same object reference for the same month
    let keyExists = false;
    for (const [k] of buckets) {
      if (k.isSame(monthKey)) {
        buckets.get(k)!.push(r);
        keyExists = true;
        break;
      }
    }
    if (!keyExists) {
      buckets.set(monthKey, [r]);
    }
  }

  return buckets;
}
