import re

with open('frontend/src/components/map/LiveMap.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Live Route Info Badge
old_badge = """      {/* ── Live Route Info Badge ── */}
      {routeOptions[selectedRouteIndex] && (
        <div className="absolute bottom-4 left-4 z-[500] bg-[#0A0E17]/95 backdrop-blur-md border border-[#1E2638] rounded-xl px-4 py-3 shadow-2xl font-mono text-xs min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-white font-bold">
                {vehicleProgress && vehicleProgress.progress >= 1 ? 'ARRIVED' : 'EN ROUTE'}
              </span>
            </div>
            <span className="text-brand-muted text-[10px]">{routeOptions[selectedRouteIndex].distance} total</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#1E2638] rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
              style={{ width: `${vehicleProgress ? Math.round(vehicleProgress.progress * 100) : 0}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[11px]">
            <div className="text-brand-muted">
              Remaining: <span className="text-white">
                {vehicleProgress 
                  ? `${(vehicleProgress.remainingDistance / 1000).toFixed(1)} km`
                  : routeOptions[selectedRouteIndex].distance}
              </span>
            </div>
            <div className="text-brand-muted">
              ETA: <span className="text-emerald-400 font-bold">
                {vehicleProgress
                  ? vehicleProgress.progress >= 1 
                    ? 'Arrived'
                    : `${vehicleProgress.remainingTime}s`
                  : routeOptions[selectedRouteIndex].duration}
              </span>
            </div>
          </div>
        </div>
      )}"""

new_badge = """      {/* ── Live Route Info Badge ── */}
      {routeOptions[selectedRouteIndex] && vehicleProgress && (
        <div className="absolute bottom-4 left-4 z-[500] bg-[#0A0E17]/95 backdrop-blur-md border border-[#1E2638] rounded-xl shadow-2xl font-mono text-xs min-w-[300px] overflow-hidden">
          
          <div className="bg-[#1E2638]/50 px-4 py-2 border-b border-[#1E2638] flex justify-between items-center">
            <span className="text-white font-bold text-sm">DISPATCHED UNIT</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 font-bold tracking-wider uppercase">
                {vehicleProgress.progress >= 1 ? 'Arrived' : 'En Route'}
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-brand-muted mb-0.5">ETA</div>
                <div className="text-white font-bold text-sm">
                  {vehicleProgress.progress >= 1 ? '0 min' : `${Math.ceil(vehicleProgress.remainingTime / 60)} min`}
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Distance</div>
                <div className="text-white font-bold text-sm">
                  {(vehicleProgress.remainingDistance / 1000).toFixed(1)} km
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Speed</div>
                <div className="text-white font-bold text-sm text-blue-400">
                  {vehicleProgress.progress >= 1 ? '0 km/h' : '42 km/h'}
                </div>
              </div>
              <div>
                <div className="text-brand-muted mb-0.5">Route</div>
                <div className="text-white font-bold text-sm truncate">
                  {selectedRouteIndex === 0 ? 'Primary' : `Alternate ${selectedRouteIndex}`}
                </div>
              </div>
            </div>

            <div className="w-full">
               <div className="flex justify-between text-[10px] text-brand-muted mb-1">
                 <span>Progress</span>
                 <span>{Math.round(vehicleProgress.progress * 100)}%</span>
               </div>
               <div className="w-full h-2 bg-[#1E2638] rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                   style={{ width: `${Math.round(vehicleProgress.progress * 100)}%` }}
                 ></div>
               </div>
            </div>

            {vehicleProgress.progress < 1 && (
              <div className="bg-[#1E2638]/30 rounded p-2 border border-[#1E2638]/50 mt-1">
                <div className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Next Turn</div>
                <div className="text-white flex items-center gap-2 text-sm">
                  <span className="text-blue-400 font-sans text-xl leading-none">↰</span> 
                  Follow route geometry
                </div>
              </div>
            )}
          </div>
        </div>
      )}"""

if old_badge in content:
    content = content.replace(old_badge, new_badge)
    with open('frontend/src/components/map/LiveMap.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Old badge not found")
