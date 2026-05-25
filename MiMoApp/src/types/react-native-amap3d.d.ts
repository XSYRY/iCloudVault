declare module 'react-native-amap3d' {
  import type React from 'react';

  export const MapType: {
    Standard: string;
  };

  export const AMapSdk: {
    init(config: any): void;
  };

  export class MapView extends React.Component<any> {
    moveCamera(camera: any, duration?: number): void;
  }

  export class Marker extends React.Component<any> {}

  export class Polyline extends React.Component<any> {}
}
