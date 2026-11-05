import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_ROUTES } from '../../data/mockData';
import { Navigation } from 'lucide-react';
import L from 'leaflet';

export const CleanRoutingMap: React.FC = () => {
  const { selectedRouteId, setSelectedRouteId, userProfile } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.6412],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    leafletMapRef.current = map;

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const routesGroup = L.featureGroup().addTo(map);

    MOCK_ROUTES.forEach((route) => {
      const isClean = route.type === 'clean';
      
      // Glow line
      const glowLine = L.polyline(route.coordinates, {
        color: isClean ? '#10b981' : '#ef4444',
        weight: isClean ? 12 : 10,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routesGroup.addLayer(glowLine);

      // Core line
      const mainLine = L.polyline(route.coordinates, {
        color: isClean ? '#10b981' : '#ef4444',
        weight: isClean ? 7 : 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isClean ? undefined : '10, 8'
      });
      routesGroup.addLayer(mainLine);

      mainLine.on('click', () => {
        setSelectedRouteId(route.id);
      });

      // Add waypoints
      route.waypoints.forEach((wp) => {
        const markerHtml = `
          <div style="
            background: ${isClean ? '#064e3b' : '#7f1d1d'};
            border: 2px solid ${isClean ? '#10b981' : '#ef4444'};
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 0 10px ${isClean ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'};
          ">
            ${wp.name}: ${wp.pm25}µg
          </div>
        `;
        const icon = L.divIcon({
          className: 'custom-wp-icon',
          html: markerHtml,
          iconSize: [80, 20],
          iconAnchor: [40, 10]
        });

        const marker = L.marker([wp.lat, wp.lng], { icon });
        routesGroup.addLayer(marker);
      });
    });

    // Start / End markers
    const startIcon = L.divIcon({
      className: 'custom-start-icon',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0284c7;
          border: 3px solid #ffffff;
          box-shadow: 0 0 15px rgba(2,132,199,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 10px;
        ">A</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    const endIcon = L.divIcon({
      className: 'custom-end-icon',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          border: 3px solid #ffffff;
          box-shadow: 0 0 15px rgba(16,185,129,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 10px;
        ">B</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([12.9352, 77.6245], { icon: startIcon }).addTo(map);
    L.marker([13.0080, 77.6890], { icon: endIcon }).addTo(map);

    map.fitBounds(routesGroup.getBounds(), { padding: [40, 40] });

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl glass-panel">
        <div className="absolute top-4 left-4 z-[400] max-w-xs sm:max-w-md p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
              <Navigation className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              AtmosAi Clean Corridors
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Comparing <strong className="text-red-400">Red Arterial Route</strong> vs <strong className="text-emerald-400">Green Clean Corridor</strong>
          </p>
        </div>

        <div className="absolute top-4 right-4 z-[400] hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-semibold text-slate-200">
          <span>Active Persona:</span>
          <span className="text-cyan-400 capitalize">{userProfile.persona}</span>
        </div>

        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_ROUTES.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const isClean = route.type === 'clean';

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? isClean
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/50'
                    : 'border-red-400 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-400/50'
                  : 'glass-panel hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      isClean ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">
                      {route.title}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {route.subtitle}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isClean
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40'
                      : 'text-red-300 bg-red-950/60 border-red-500/40'
                  }`}
                >
                  {isClean ? 'Clean Shield' : 'Pollution Alert'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Avg PM2.5</span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${isClean ? 'text-emerald-400' : 'text-red-400'}`}>
                    {route.avgPM25} µg
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Inhalation</span>
                  <span className={`text-xs sm:text-sm font-bold ${isClean ? 'text-emerald-400' : 'text-red-400'}`}>
                    {route.inhalationDelta}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {route.durationMins} min
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block">Distance</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {route.distanceKm} km
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3 pt-2 border-t border-white/5 leading-relaxed">
                {route.demographicAdvice}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isClean ? '✓ Recommended for your profile' : '⚠ High soot zone'}
                </span>
                <button
                  type="button"
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    isClean
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  {isSelected ? 'Route Selected' : 'Select Route'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CleanRoutingMap;

