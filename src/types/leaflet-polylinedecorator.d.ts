
import * as L from 'leaflet';

declare module 'leaflet' {
    namespace Symbol {
        interface ArrowHeadOptions {
            pixelSize?: number;
            polygon?: boolean;
            pathOptions?: L.PathOptions;
            headAngle?: number;
        }
        function arrowHead(options?: ArrowHeadOptions): any;
    }

    interface PolylineDecoratorOptions {
        patterns: Array<{
            offset?: number | string;
            endOffset?: number | string;
            repeat?: number | string;
            symbol: any;
        }>;
    }

    function polylineDecorator(
        paths: L.Polyline | L.Polygon | L.LatLngExpression[] | L.Polyline[],
        options?: PolylineDecoratorOptions
    ): any;
}
