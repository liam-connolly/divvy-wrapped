
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

interface FlowLineProps {
  positions: [number, number][];
  color: string;
  weight: number;
  opacity: number;
}

export default function FlowLine({ positions, color, weight, opacity }: FlowLineProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create the polyline
    const polyline = L.polyline(positions, {
      color,
      weight,
      opacity,
    }).addTo(map);

    // Create the arrow decorator
    // We adjust pixelSize based on weight to make bigger flows have bigger arrows
    const arrowSize = Math.max(5, weight * 1.5); 
    
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '100%', // Arrow at the end
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: arrowSize,
            polygon: false, // V-shape arrow
            pathOptions: { 
                stroke: true, 
                color: color, 
                weight: Math.max(1, weight / 2),
                opacity: opacity 
            }
          })
        },
        // Optional: Add arrows along the line for longer flows? 
        // Let's stick to one at the end for now to reduce clutter, 
        // or maybe one in the middle if it's long.
        // User asked "demonstrated in arrows... in the direction".
        // A single arrow at the end works well for A->B.
      ]
    }).addTo(map);

    return () => {
      map.removeLayer(polyline);
      map.removeLayer(decorator);
    };
  }, [map, positions, color, weight, opacity]);

  return null;
}
