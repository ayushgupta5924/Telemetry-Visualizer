import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { COORDINATE_SYSTEM, OrthographicView } from '@deck.gl/core';
import { DataFilterExtension } from '@deck.gl/extensions';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import { useEffect, useState } from 'react';

const INITIAL_VIEW_STATE = {
  target: [512, 512, 0],
  zoom: -1,
  minZoom: -2,
  maxZoom: 4,
};

function App() {
  const [hoverInfo, setHoverInfo] = useState(null);
  const [filters, setFilters] = useState({ maps: [], dates: [], matches: [] });
  const [selectedMap, setSelectedMap] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMatch, setSelectedMatch] = useState('');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 });

  const [viewMode, setViewMode] = useState('paths');

  useEffect(() => {
    fetch('https://telemetry-visualizer.onrender.com/api/filters')
      .then(res => res.json())
      .then(data => setFilters(data))
      .catch(err => console.error("Filter fetch error:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedMap) params.append('map_id', selectedMap);
    if (selectedDate) params.append('date', selectedDate);
    if (selectedMatch) params.append('match_id', selectedMatch);

    fetch(`https://telemetry-visualizer.onrender.com/api/events?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const parsedData = data.map(d => ({
          ...d,
          numeric_ts: new Date(d.ts).getTime()
        }));

        setEvents(parsedData);

        if (parsedData.length > 0) {
          const times = parsedData.map(d => d.numeric_ts);
          const minT = Math.min(...times);
          const maxT = Math.max(...times);
          setTimeRange({ min: minT, max: maxT });
          setCurrentTime(maxT);
        } else {
          setTimeRange({ min: 0, max: 0 });
          setCurrentTime(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Event fetch error:", err);
        setLoading(false);
      });
  }, [selectedMap, selectedDate, selectedMatch]);

  const getMapImage = (mapId) => {
    if (!mapId) return '';
    if (mapId === 'Lockdown') return '/Lockdown_Minimap.jpg';
    return `/${mapId}_Minimap.png`;
  };

  const getEventColor = (d) => {
    if (d.event === 'Kill' || d.event === 'BotKill') return [255, 50, 50, 255];
    if (d.event === 'Killed' || d.event === 'BotKilled') return [0, 0, 0, 255];
    if (d.event === 'Loot') return [255, 215, 0, 255];
    if (d.event === 'KilledByStorm') return [148, 0, 211, 255];
    return d.is_bot ? [150, 150, 150, 100] : [0, 200, 255, 100];
  };

  const getEventRadius = (d) => {
    if (d.event.includes('Position')) return 2;
    return 6;
  };

  // data feeding
  const visibleEvents = events.filter(e => e.numeric_ts <= currentTime);

  const heatmapData = viewMode === 'combat'
    ? visibleEvents.filter(e => e.event.includes('Kill'))
    : visibleEvents;

  const layers = [];

  if (viewMode === 'paths') {
    layers.push(
      new ScatterplotLayer({
        pickable: true,
        onHover: info => setHoverInfo(info),
        id: 'player-positions',
        data: events, // Paths still use the lightning-fast GPU filter
        getPosition: d => [d.pixel_x, d.pixel_y],
        getFillColor: getEventColor,
        getRadius: getEventRadius,
        radiusMinPixels: 2,
        getFilterValue: d => d.numeric_ts,
        filterRange: [timeRange.min, currentTime],
        extensions: [new DataFilterExtension({ filterSize: 1 })],
        updateTriggers: {
          getFillColor: [currentTime],
          getRadius: [currentTime]
        }
      })
    );
  } else {
    layers.push(
      new HeatmapLayer({
        id: `heatmap-${viewMode}`,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: heatmapData, // Pass the CPU-filtered data here
        getPosition: d => [d.pixel_x, d.pixel_y],
        getWeight: d => 1,
        radiusPixels: 50,
        intensity: viewMode === 'combat' ? 5 : 2,
        threshold: 0.01,
        colorRange: [
          [255, 255, 178, 50],
          [254, 204, 92, 150],
          [253, 141, 60, 200],
          [240, 59, 32, 220],
          [189, 0, 38, 255]
        ]
      })
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111', fontFamily: 'sans-serif', overflow: 'hidden' }}>

      {selectedMap && (
        <img
          src={getMapImage(selectedMap)}
          alt={selectedMap}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '1024px', height: '1024px',
            objectFit: 'contain', opacity: 0.7
          }}
        />
      )}

      <DeckGL
        views={new OrthographicView({ id: 'ortho' })}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      />

      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(20, 20, 25, 0.9)', padding: '20px', borderRadius: '12px', zIndex: 10, minWidth: '300px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>LILA Visualizer</h2>

        {/* VIEW MODE TOGGLES */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          <button onClick={() => setViewMode('paths')} style={{ flex: 1, padding: '8px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold', background: viewMode === 'paths' ? '#00d2ff' : '#333', color: viewMode === 'paths' ? '#000' : '#fff' }}>Paths</button>
          <button onClick={() => setViewMode('traffic')} style={{ flex: 1, padding: '8px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold', background: viewMode === 'traffic' ? '#ffaa00' : '#333', color: viewMode === 'traffic' ? '#000' : '#fff' }}>Traffic</button>
          <button onClick={() => setViewMode('combat')} style={{ flex: 1, padding: '8px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold', background: viewMode === 'combat' ? '#ff3366' : '#333', color: viewMode === 'combat' ? '#fff' : '#fff' }}>Combat</button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Map</label>
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white' }}>
            <option value="">All Maps (Data Only)</option>
            {filters.maps.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Date</label>
          <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white' }}>
            <option value="">All Dates</option>
            {filters.dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Specific Match</label>
          <select value={selectedMatch} onChange={(e) => setSelectedMatch(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white' }}>
            <option value="">All Matches</option>
            {filters.matches.map(m => <option key={m} value={m}>{m.split('.')[0]}</option>)}
          </select>
        </div>

        <div style={{ borderTop: '1px solid #444', paddingTop: '15px', fontSize: '0.9rem' }}>
          {loading ? <span style={{ color: '#00d2ff' }}>Fetching telemetry...</span> : <span style={{ color: '#4CAF50' }}>Rendering {events.length.toLocaleString()} events</span>}
        </div>
      </div>

      {events.length > 0 && (
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: '80%', background: 'rgba(20, 20, 25, 0.9)', padding: '15px 30px', borderRadius: '12px', color: 'white', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.8rem' }}>
            <span>Match Start</span>
            <span>Match Progress</span>
            <span>Match End</span>
          </div>
          <input
            type="range"
            min={timeRange.min}
            max={timeRange.max}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      )}

      {viewMode === 'paths' && (
        <div style={{ position: 'absolute', top: 20, right: 20, color: 'white', background: 'rgba(20, 20, 25, 0.9)', padding: '15px', borderRadius: '12px', zIndex: 10, fontSize: '0.9rem' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Legend</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'rgb(0, 200, 255)', borderRadius: '50%', marginRight: '8px' }}></div> Human Move</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'rgb(150, 150, 150)', borderRadius: '50%', marginRight: '8px' }}></div> Bot Move</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '16px', height: '16px', background: 'rgb(255, 50, 50)', borderRadius: '50%', marginRight: '8px' }}></div> Kill</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '16px', height: '16px', background: 'rgb(0, 0, 0)', borderRadius: '50%', marginRight: '8px', border: '1px solid #333' }}></div> Death</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '16px', height: '16px', background: 'rgb(255, 215, 0)', borderRadius: '50%', marginRight: '8px' }}></div> Loot</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: '16px', height: '16px', background: 'rgb(148, 0, 211)', borderRadius: '50%', marginRight: '8px' }}></div> Storm Death</div>
        </div>
      )}

      {/* Interactive Tooltip */}
      {hoverInfo && hoverInfo.object && (
        <div style={{
          position: 'absolute',
          zIndex: 999,
          pointerEvents: 'none',
          left: hoverInfo.x + 10,
          top: hoverInfo.y + 10,
          background: 'rgba(20, 20, 25, 0.95)',
          color: '#fff',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          border: '1px solid #444',
          boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '4px' }}><strong style={{ color: '#00d2ff' }}>Event:</strong> {hoverInfo.object.event}</div>
          <div style={{ marginBottom: '4px' }}><strong style={{ color: '#00d2ff' }}>Player:</strong> {hoverInfo.object.user_id}</div>
          <div><strong style={{ color: '#00d2ff' }}>Timestamp:</strong> {hoverInfo.object.ts}</div>
        </div>
      )}

    </div>
  );
}

export default App;