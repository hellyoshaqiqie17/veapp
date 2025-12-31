import Colors from '@/constants/Colors';
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CAR_SVG } from './CarSvg';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  plateNumber?: string;
  status?: string;
  isEngineOn?: boolean;
  isOverSpeed?: boolean;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  centerCoordinate?: [number, number];
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGVsbHlvc2hhcWlxaWUiLCJhIjoiY20wMzloNm81MDlqOTJxc2ExOWp3eWJkbiJ9.bfRMSLMCqZ_A1oyrRbaUdg';

const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  centerCoordinate = [112.7521, -7.2575],
}) => {
  const webViewRef = useRef<WebView>(null);

  const sendVehicleUpdate = () => {
    if (webViewRef.current) {
      const vehicleData = vehicles.map(v => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        name: v.name || 'Vehicle',
        status: v.status || '',
      }));
      
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateVehicles',
        vehicles: vehicleData
      }));
    }
  };

  // Send vehicle updates when vehicles change
  useEffect(() => {
    sendVehicleUpdate();
  }, [vehicles]);

  const lastSelectedIdRef = useRef<string | null>(null);

  // Send selection updates (FlyTo)
  useEffect(() => {
    if (selectedVehicle && webViewRef.current) {
      // Only fly if ID changed
      if (selectedVehicle.id !== lastSelectedIdRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'selectVehicle',
          id: selectedVehicle.id,
          center: [selectedVehicle.lng, selectedVehicle.lat]
        }));
        lastSelectedIdRef.current = selectedVehicle.id;
      }
    }
  }, [selectedVehicle]);

  const htmlContent = useMemo(() => {
    // Inject initial vehicles to ensure they render immediately if possible
    const initialVehicles = JSON.stringify(vehicles.map(v => ({
      id: v.id,
      lat: v.lat,
      lng: v.lng,
      name: v.name || 'Vehicle',
      status: v.status || '',
    })));

    // Robust SVG injection using encodeURIComponent
    const encodedCarSvg = encodeURIComponent(CAR_SVG);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    
    .marker-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    
    .marker-label {
      background: white;
      padding: 8px 12px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-bottom: 12px;
      text-align: center;
      border: none;
      display: none;
      min-width: 100px;
      font-family: 'Inter', sans-serif;
    }
    
    .marker-label.visible {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    .label-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 2px;
    }
    
    .label-subtitle {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: #EF4444;
    }
    
    .marker-icon {
      width: 40px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      position: relative;
    }
    
    .marker-icon:hover {
      transform: scale(1.1);
    }

    .marker-pulse {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.2);
      animation: pulse 2s ease-out infinite;
      position: absolute;
      bottom: 0;
      z-index: 0;
    }
    
    .marker-pulse.selected {
      background: rgba(16, 185, 129, 0.3);
      width: 50px;
      height: 50px;
    }
    
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    .marker-svg {
      z-index: 10;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      width: 26px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .marker-svg svg {
      width: 100%;
      height: 100%;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_TOKEN}';
    
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v11',
      center: [${centerCoordinate[0]}, ${centerCoordinate[1]}],
      zoom: 14,
      attributionControl: false
    });
    
    // Decode SVG safely
    const carSvg = decodeURIComponent("${encodedCarSvg}");
    const markers = {}; // Store markers by ID

    function getUniqueSvg(svgString, suffix) {
      // Replace IDs
      let uniqueSvg = svgString.replace(/id="([^"]+)"/g, 'id="$1_' + suffix + '"');
      // Replace References
      uniqueSvg = uniqueSvg.replace(/url\(#([^)]+)\)/g, 'url(#$1_' + suffix + ')');
      return uniqueSvg;
    }

    function createMarkerElement(vehicle) {
      const el = document.createElement('div');
      el.className = 'marker-container';
      el.id = 'marker-' + vehicle.id;
      
      
      // Direct base64 encoding without ID modifications
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(carSvg);
      
      el.innerHTML = \`
        <div class="marker-label \${vehicle.isSelected ? 'visible' : ''}">
          <div class="label-title">\${vehicle.name}</div>
          <div class="label-subtitle">\${vehicle.status}</div>
        </div>
        <div class="marker-icon">
          <div class="marker-pulse \${vehicle.isSelected ? 'selected' : ''}"></div>
          <img src="\${svgDataUri}" class="marker-svg" />
        </div>
      \`;
      
      el.addEventListener('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'vehicleSelected',
          vehicleId: vehicle.id
        }));
      });
      
      return el;
    }

    function updateMarkers(vehicles) {
      const currentIds = new Set(vehicles.map(v => v.id));
      
      // Remove old markers
      Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
          markers[id].remove();
          delete markers[id];
        }
      });

      // Add or update markers
      vehicles.forEach(vehicle => {
        if (markers[vehicle.id]) {
          // Update position
          markers[vehicle.id].setLngLat([vehicle.lng, vehicle.lat]);
        } else {
          // Create new
          const el = createMarkerElement(vehicle);
          const marker = new mapboxgl.Marker(el)
            .setLngLat([vehicle.lng, vehicle.lat])
            .addTo(map);
          markers[vehicle.id] = marker;
        }
      });
    }

    function selectVehicle(id, center) {
      // Update UI
      document.querySelectorAll('.marker-label').forEach(l => l.classList.remove('visible'));
      document.querySelectorAll('.marker-pulse').forEach(p => p.classList.remove('selected'));
      
      const markerEl = document.getElementById('marker-' + id);
      if (markerEl) {
        markerEl.querySelector('.marker-label').classList.add('visible');
        markerEl.querySelector('.marker-pulse').classList.add('selected');
      }

      // Fly To
      if (center) {
        map.flyTo({
          center: center,
          zoom: 16,
          speed: 1.2, // Smooth speed
          curve: 1.42,
          essential: true
        });
      }
    }

    // Initialize with injected vehicles
    const initialVehicles = ${initialVehicles};
    if (initialVehicles && initialVehicles.length > 0) {
      updateMarkers(initialVehicles);
    }

    // Listen for messages
    document.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'updateVehicles') {
          updateMarkers(data.vehicles);
        } else if (data.type === 'selectVehicle') {
          selectVehicle(data.id, data.center);
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    });

    // Notify RN that map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  </script>
</body>
</html>
    `;
  }, []); // Keep dependencies empty to prevent reload

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'vehicleSelected') {
        const vehicle = vehicles.find((v) => v.id === data.vehicleId);
        if (vehicle) onSelectVehicle(vehicle);
      } else if (data.type === 'mapReady') {
        // Map is ready, send current vehicles
        sendVehicleUpdate();
      }
    } catch (e) {
      console.log('WebView message error:', e);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text>Map available on mobile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FleetMap;
