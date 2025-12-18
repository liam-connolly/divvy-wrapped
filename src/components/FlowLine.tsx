
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

interface FlowLineProps {
  positions: [number, number][];
  color: string;
  weight: number;
  opacity: number;
  onClick?: (latlng: L.LatLng) => void;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}

export default function FlowLine({ positions, color, weight, opacity, onClick, isHovered = false, onHoverChange }: FlowLineProps) {
  const map = useMap();

  // Dynamic style based on hover
  const displayWeight = isHovered ? Math.max(5, weight * 2) : weight;
  const displayOpacity = isHovered ? 0.9 : opacity;

  useEffect(() => {
    if (!map) return;

    // Create the polyline
    const polyline = L.polyline(positions, {
      color,
      weight: displayWeight,
      opacity: displayOpacity,
      bubblingMouseEvents: false 
    }).addTo(map);

    // Event Listeners
    polyline.on('mouseover', (e) => {
        onHoverChange?.(true);
        L.DomEvent.stopPropagation(e as any);
        // @ts-ignore
        if (polyline._path) polyline._path.style.cursor = 'pointer';
    });

    polyline.on('mouseout', (e) => {
        onHoverChange?.(false);
        L.DomEvent.stopPropagation(e as any);
    });

    if (onClick) {
        polyline.on('click', (e) => {
            L.DomEvent.stopPropagation(e as any); // Stop map click from firing
            L.DomEvent.preventDefault(e as any);
            onClick(e.latlng);
        });
    }

    // Create the arrow decorator
    const arrowSize = Math.max(5, displayWeight * 1.5); 
    
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '100%', 
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: arrowSize,
            polygon: false, 
            pathOptions: { 
                stroke: true, 
                color: color, 
                weight: Math.max(1, displayWeight / 2),
                opacity: displayOpacity,
                interactive: false 
            }
          })
        }
      ]
    }).addTo(map);

    return () => {
      map.removeLayer(polyline);
      map.removeLayer(decorator);
    };
  }, [map, positions, color, weight, opacity, onClick, onHoverChange, displayWeight, displayOpacity]);

  return null;
}
