/** randomDate
 * 
 * Simple helper returns a randomized datetime within the provided range
 */

export const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/** parseDate
 * 
 * Returns a date broken up into strings for each field.
 * Makes it easier to render dates in a granular way 
 */
interface ParsedDate {
  year: string;
  month: string;
  day: string;
}
export const parseDate = (date: Date): ParsedDate => {
  return {
    year: date.toISOString().substring(0, 4),
    month: date.toISOString().substring(5, 7),
    day: date.toISOString().substring(8, 10)
  }
}

export const makeDDNWorkspaceQuery = (date: Date) => {
  const { year, month, day } = parseDate(date);
  return `
SELECT
  "tpep_pickup_datetime",
  "tpep_dropoff_datetime",
  "passenger_count",
  "trip_distance",
  "PULocationID",
  "DOLocationID",
  "fare_amount",
  "tip_amount"
FROM
  "paws/nyctaxi:latest"."yellow_tripdata_${year}-${month}"
WHERE
  tpep_dropoff_datetime >= '${year}-${month}-${day}'
`
}