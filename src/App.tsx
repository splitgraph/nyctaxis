import { useState, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { useEffectOnce } from "./useEffectOnce";
import * as taxizones from "./data/taxizones_id.json";
import Controls from './control-widget'
import { getTaxizonesByDay } from './ddn-fetcher'
import { randomDate, parseDate } from './util';
import './styles.css'

mapboxgl.accessToken = 'GET_YOUR_TOKEN_AT_MAPBOX.COM';

interface Zone {
  id: string;
  zone: string;
  borough: string;
  pickups?: string;
  dropoffs?: string;
  maxPickups?: string;
  maxDropoffs?: string;
}

type PickupsDropoffs = 'pickups' | 'dropoffs'

interface TaxizoneActivityRecord {
  location_id: number;
  pickup_count: number;
  dropoff_count: number;
}

// NOTE: its normally better to set these within React, but unf React+MapboxGL both
// want to 'own' DOM updates. Thus we set these values at the module level.
let map: mapboxgl.Map;
let data: Record<string, TaxizoneActivityRecord[]> = {};

const App = () => {
  // Init MapboxGL's viewport to (roughly) cover NYC
  const [long, setLong] = useState(-73.971321);
  const [lat, setLat] = useState(40.7146);
  const [zoom, setZoom] = useState(10.2);
  const mapContainer = useRef<HTMLDivElement>(null);

  const [hoveredZone, setHoveredZone] = useState<Zone | undefined>();
  const hoveredZoneRef = useRef(hoveredZone);

  const [showType, setShowType] = useState<PickupsDropoffs>('pickups')

  // We want to fetch taxi rides starting from a specific datetime
  // We default to a random datetime in Jan 2020.
  const [date, setDate] = useState<Date>(randomDate(new Date('2020-04-01'), new Date('2020-04-28')));
  const { year, month, day } = parseDate(date);

  const changeShowType = (newShowType: PickupsDropoffs) => {
    setShowType(newShowType)
    drawTaxizones(data[year], newShowType);
  }

  // UI
  const [isDirty, setIsDirty] = useState(false);
  const [spinner, setSpinner] = useState(false);

  const setYear = (newYear: string) => {
    setDate(new Date(`${newYear}-${month}-${day}`))
    drawTaxizones(data[newYear], showType)
  }

  const setDay = (newDay: string) => {
    setDate(new Date(`${year}-${month}-${('0' + newDay).slice(-2)}`))
    setIsDirty(true)
  }

  const queryDDN = (date: Date) => {
    return new Promise((resolve, reject) => {
      getTaxizonesByDay(date).then(({ response }) => {
        if (response) {
          if (response.success) {
            resolve(response.rows)
          } else if (!response.success) {
            reject(response)
          }
        }
      })
    })
  }

  const handleLoadDataClick = async () => {
    setSpinner(true);

    const response = await Promise.all([
      queryDDN(date),
      queryDDN(new Date(`2021-${month}-${day}`)),
      queryDDN(new Date(`2022-${month}-${day}`)),
    ])

    if (response.length === 3) {
      data[2020] = response[0] as TaxizoneActivityRecord[];
      data[2021] = response[1] as TaxizoneActivityRecord[];
      data[2022] = response[2] as TaxizoneActivityRecord[];
    }

    setSpinner(false)
    setIsDirty(false)

    // We should have data - draw it!
    drawTaxizones(data[year], showType)
  }

  const setHoveredZoneStateAndRef = (data: Zone | undefined) => {
    hoveredZoneRef.current = data;
    setHoveredZone(data);
  };

  useEffectOnce(() => {
    map = new mapboxgl.Map({
      container: mapContainer.current as HTMLDivElement,
      style: "mapbox://styles/mapbox/light-v10",
      center: [long, lat],
      zoom: zoom,
      attributionControl: false
    });
    map.addControl(new mapboxgl.AttributionControl({
      customAttribution: 'Powered by Splitgraph',
      compact: true
    }));

    map.once("load", () => {
      map.addSource('taxizones', {
        'type': 'geojson',
        'data': taxizones as GeoJSON.FeatureCollection
      });

      // // add taxizone outlines
      map.addLayer({
        'id': 'tazizones-lines-layer',
        'type': 'line',
        'source': 'taxizones',
        'layout': {},
        'paint': {
          "line-color": "#113388",
          "line-opacity": .1
        }
      });

      // add hoverable/filled taxi zones
      map.addLayer({
        'id': 'tazizones-layer',
        'type': 'fill',
        'source': 'taxizones',
        'layout': {},
        'paint': {
          'fill-color': '#627BC1',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5
          ]
        }
      });

      // hoveredZone is rendered by the control panel; we want to update on mousemove
      map.on('mousemove', 'tazizones-layer', (e) => {
        if (e && e.features && e.features.length > 0) {
          if (hoveredZoneRef.current) {
            map.setFeatureState(
              { source: 'taxizones', id: hoveredZoneRef.current.id },
              { hover: false }
            );
          }

          const id = e.features[0].id! as string;
          const { zone, borough } = e.features[0].properties as Zone
          map.setFeatureState(
            { source: 'taxizones', id: id },
            { hover: true }
          );
          const { pickups, dropoffs } = map.getFeatureState({ source: 'taxizones', id: id });

          setHoveredZoneStateAndRef({ id, zone, borough, pickups, dropoffs });
        }

      });

      // When the mouse leaves, set FeatureState hover to false
      map.on('mouseleave', 'tazizones-layer', () => {
        if (hoveredZoneRef.current) {
          map.setFeatureState(
            { source: 'taxizones', id: hoveredZoneRef.current.id },
            { hover: false }
          );
        }
        setHoveredZoneStateAndRef(undefined);
      });

      map.on('move', () => {
        const { lng, lat } = map.getCenter();
        if (lng && lat && map) {
          setLong(+lng.toFixed(4));
          setLat(+lat.toFixed(4));
          setZoom(+map.getZoom().toFixed(2));
        }
      });
    });
  });

  const drawTaxizones = (rows: TaxizoneActivityRecord[], showType: PickupsDropoffs) => {
    const { pickups, dropoffs } = getPickupsAndDropoffs(rows)
    const { pickupResults, dropoffResults } = generateMapLayer(pickups, dropoffs)

    // clean up the default/previous layer
    map.removeLayer('tazizones-layer')

    map.addLayer({
      'id': `tazizones-layer`,
      'type': 'fill',
      'source': 'taxizones',
      'layout': {},
      'paint': {
        'fill-color': showType === 'dropoffs' ? dropoffResults : pickupResults,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.5
        ]
      }
    });

    // superimpose taxizone id
    // map.addLayer({
    //   'id': `tazizones-layer-max`,
    //   'type': 'symbol',
    //   'source': 'taxizones',
    //   'layout': {
    //     'text-field': ['get', 'OBJECTID'],
    //     'text-offset': [0, 1.25],
    //     'text-anchor': 'top'
    //   },
    // });
  }


  const getPickupsAndDropoffs = (rows: TaxizoneActivityRecord[]) => {
    const pickups: Record<number, number> = {};
    const dropoffs: Record<number, number> = {};

    // for each row we got back, increment activity count for each pickup/dropoff
    rows.forEach((row) => {
      const { location_id, pickup_count, dropoff_count } = row;
      pickups[location_id] = pickup_count;
      dropoffs[location_id] = dropoff_count;
    });
    return { pickups, dropoffs }
  }

  interface MapLayerResults {
    pickupResults: mapboxgl.Expression;
    dropoffResults: mapboxgl.Expression;
  }

  const generateMapLayer = (pickups: Record<number, number>, dropoffs: Record<number, number>): MapLayerResults => {
    const matchByObjectID: mapboxgl.Expression = ['match', ['get', 'OBJECTID']]
    const fallbackColor = '#627BC1';

    const maxPickups = Math.max(...Object.values(data).flat().map(({ pickup_count }) => pickup_count));
    const maxDropoffs = Math.max(...Object.values(data).flat().map(({ dropoff_count }) => dropoff_count));
    const taxizonePickups = Object.entries(pickups).map(([key, value]) =>
      [+key, `rgba(0,0,255,${(Number(value) / maxPickups * 100)})`]
    ).flat()
    const taxizoneDropoffs = Object.entries(dropoffs).map(([key, value], index) =>
      [+key, `rgba(255,0,0,${(Number(value) / maxDropoffs * 100)})`]
    ).flat()
    const pickupResults: mapboxgl.Expression = [...matchByObjectID, ...taxizonePickups, fallbackColor];
    const dropoffResults: mapboxgl.Expression = [...matchByObjectID, ...taxizoneDropoffs, fallbackColor];

    Object.entries(pickups).forEach(([key, value]) => {
      map.setFeatureState(
        { source: 'taxizones', id: key },
        { pickups: value }
      );
    })
    Object.entries(dropoffs).forEach(([key, value]) => {
      map.setFeatureState(
        { source: 'taxizones', id: key },
        { dropoffs: value }
      );
    })

    return { pickupResults, dropoffResults };
  }

  return (
    <>
      <div className={'map'}>
        <div style={{ height: "100%", opacity: isDirty ? .8 : 1 }} ref={mapContainer} />
        <Controls
          date={date}
          setDate={setDate}
          year={year} setYear={setYear}
          day={day} setDay={setDay}
          hoveredZone={hoveredZone}
          handleLoadDataClick={handleLoadDataClick}
          spinner={spinner}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          showType={showType}
          changeShowType={changeShowType}
          data={data}
        />
      </div>
    </>
  );
}

export default App;