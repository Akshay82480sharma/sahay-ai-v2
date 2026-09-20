with open('frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

sim_controls = """          {/* Simulation Engine Controls (Floating Top Right) */}
          {selectedIncident && vehicleProgress && vehicleProgress.progress < 1 && (
            <div className="absolute top-4 right-4 z-[400] bg-[#0A0E17]/95 backdrop-blur-sm border border-[#1E2638] rounded-xl p-3 shadow-xl min-w-[200px]">
              <h4 className="text-[10px] text-brand-muted uppercase font-bold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Simulation Events
              </h4>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    if(vehicleProgress.currentPosition) {
                      setDeviationOrigin(vehicleProgress.currentPosition);
                      setSelectedRouteIndex(1); // Force an alternate route due to closure
                    }
                  }}
                  className="bg-[#1E2638] hover:bg-red-500/20 hover:text-red-400 border border-[#1E2638] hover:border-red-500/50 transition-colors text-xs text-white py-1.5 rounded"
                >
                  [ ROAD CLOSURE ]
                </button>
                <button 
                  onClick={() => {
                    if(vehicleProgress.currentPosition) {
                      // Perturb current position to simulate wrong turn
                      const perturbed = {
                        lat: vehicleProgress.currentPosition.lat + 0.001,
                        lng: vehicleProgress.currentPosition.lng - 0.001
                      };
                      setDeviationOrigin(perturbed);
                      setSelectedRouteIndex(0); // Re-calculate primary route from new location
                    }
                  }}
                  className="bg-[#1E2638] hover:bg-orange-500/20 hover:text-orange-400 border border-[#1E2638] hover:border-orange-500/50 transition-colors text-xs text-white py-1.5 rounded"
                >
                  [ WRONG TURN ]
                </button>
              </div>
            </div>
          )}

          {/* Legends floating on map */}"""

content = content.replace('{/* Legends floating on map */}', sim_controls)

with open('frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
