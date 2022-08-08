import { memo, useEffect } from 'react';
import { parseDate, makeDDNWorkspaceQuery } from './util'
import wheel from './wheel.gif'
import YearButton from './YearButton';

const Controls = (props: any) => {
  const { data, date, setYear, setDay,
    showType, changeShowType, hoveredZone, handleLoadDataClick, spinner, isDirty } = props;
  const { year, day } = parseDate(date);

  useEffect(() => {
    // disallow typing chars since it will likely cause a break
    Array.from(document.getElementsByClassName('noType')).forEach((elem) => {
      elem.addEventListener("keypress", (event: Event) => {
        event.preventDefault();
      });
    })
  }, [])

  return (
    <div className="control-panel">
      <h3>NYC taxi rides in April '20, '21, '22</h3>
      <p>
        Click &quot;load&quot; to show 24h worth of taxizone activity.
      </p>
      <p>
        Powered by the Splitgraph <a href="https://www.splitgraph.com/docs/query/ddn-http">DDN</a>.
      </p>
      <summary>

        <details>
          <ul style={{ fontSize: '8pt', paddingInlineStart: '20px' }}>
            <li>Changing date makes the map &quot;dirty&quot; - refresh by clicking load.</li>
            <li>Color is relative to the <em>year-over-year</em> max.</li>
            <li>Tip: ctrl-drag for 3D, arrow keys move</li>
            <li><a href="https://www.splitgraph.com/paws/nyctaxi/latest/-/tables">Repo</a> is available.</li>
          </ul>
          <p style={{ marginBottom: 0 }}>Upstream datasets:</p>
          <ul style={{ fontSize: '8pt', paddingInlineStart: '20px' }}>
            <li>
              <a href="https://www1.nyc.gov/site/tlc/about/tlc-trip-record-data.page" target={"_blank"} rel="noreferrer">TLC trip data</a>
            </li>
            <li>
              <a href="https://s3.amazonaws.com/nyc-tlc/misc/taxi_zones.zip" target={"_blank"} rel="noreferrer">Taxi zones</a>
            </li>
          </ul>
          <p>Legend</p>
          <div>
            <div style={{ display: 'flex' }}>
              <div style={{
                width: '80px',
                background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,255,.5) 100%)"
              }}>
              </div>
              <div>&nbsp;pickups</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{
                width: '80px',
                background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,0,0,.5) 100%)"
              }}> &nbsp;
              </div>
              <div>&nbsp;dropoffs </div>
            </div>
          </div>
        </details>
      </summary>



      <div className="source-link">
        <a
          href="https://github.com/splitgraph/fe-devexp"
          target="_new"
        >
          Code ↗
        </a>
      </div>
      <hr />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div>
            April&nbsp;
            <input type="number" value={day} min={1} max={27} step={1}
              onChange={e => setDay(e.target.value)}
              style={{ width: '4em' }}
              className={'noType'}
            />
          </div>
          <div>
            <YearButton currentYear={+year} targetYear={2020} onClick={() => { setYear(2020) }}
              disabled={Object.keys(data).length === 0 || isDirty || spinner} />
            <YearButton currentYear={+year} targetYear={2021} onClick={() => { setYear(2021) }}
              disabled={Object.keys(data).length === 0 || isDirty || spinner} />
            <YearButton currentYear={+year} targetYear={2022} onClick={() => { setYear(2022) }}
              disabled={Object.keys(data).length === 0 || isDirty || spinner} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button disabled={spinner} onClick={handleLoadDataClick} style={{ height: '24px' }}>🔄 Load</button> &nbsp;
          {spinner && <img height={24} width={24} src={wheel} alt={'spinner wheel'} />}
        </div>
      </div>


      <hr />

      <div className="input">
        <label>Show</label>
        <select onChange={(e) => { changeShowType(e.target.value) }} disabled={Object.keys(data).length === 0 || isDirty || spinner} value={showType}>
          <option value={'pickups'}>Pickups 🚕 🟢</option>
          <option value={'dropoffs'}>Dropoffs 🚕 🛑</option>
        </select>
      </div>

      <div className="input" style={{ paddingTop: '.3rem' }}>
        <label>Splitgraph</label>
        <button onClick={() => {
          const url = encodeURI(`https://www.splitgraph.com/embed/workspace/ddn?layout=hsplit&query=${makeDDNWorkspaceQuery(date)}`)
          window.open(url, '_blank')
        }}>🪄</button>
      </div>

      {
        hoveredZone &&
        <div>
          <hr />
          <div>
            Borough: {hoveredZone.borough} ({hoveredZone.id})
          </div>
          <div>
            Zone: {hoveredZone.zone}
          </div>
          {hoveredZone.pickups &&
            <div>
              Pickups: {hoveredZone.pickups}
            </div>
          }
          {hoveredZone.dropoffs &&
            <div>
              Dropoffs: {hoveredZone.dropoffs}
            </div>
          }
        </div>
      }
    </div >
  );
}

export default memo(Controls);