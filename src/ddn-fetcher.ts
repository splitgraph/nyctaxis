import { makeClient } from "@madatdata/client-http";
import { parseDate } from './util'

const client = makeClient({ credential: null });

export const getTaxizonesByDay = (date: Date) => {
  const { year, month, day } = parseDate(date);
  return client.execute(`
  WITH
  pickups AS
  (
  SELECT 
    "PULocationID" as location_id,
    COUNT("PULocationID") as pickup_count
  FROM "paws/nyctaxi"."yellow_tripdata_${year}-04"
  WHERE
    tpep_dropoff_datetime >= '${year}-${month}-${day}'
  AND
    tpep_dropoff_datetime <= '${year}-${month}-${day}'::date + INTERVAL '24 HOURS'
  GROUP BY "PULocationID"
  ),
  dropoffs AS 
  (
  SELECT
    "DOLocationID" as location_id,
    COUNT("DOLocationID") as dropoff_count
  FROM "paws/nyctaxi"."yellow_tripdata_${year}-04"
  WHERE
    tpep_dropoff_datetime >= '${year}-${month}-${day}'
  AND
    tpep_dropoff_datetime <= '${year}-${month}-${day}'::date + INTERVAL '24 HOURS'
  GROUP BY "DOLocationID"
  ),
  joined AS 
  (
  SELECT 
    pickups.location_id, pickup_count, dropoff_count
  FROM
    pickups LEFT JOIN dropoffs ON pickups.location_id = dropoffs.location_id
  )
  SELECT * from joined
`);
}
