export interface TimeData {
  tz: string;
  stime: string;
  vtime: number;
}

export interface StationData {
  name: string;
  geo: [number, number];
  url: string;
}

export interface AirQualityData {
  uid: number;
  aqi: string;
  time: TimeData;
  station: StationData;
}

export interface BasicStationData {
  lat: number;
  lon: number;
  uid: number;
  aqi: string;
}

export interface AttributionsData {
  url: string;
  name: string;
}

export interface DetailedStationData {
  aqi: number;
  idx: number;
  attributions: AttributionsData[];
  city: {
    geo: [number, number];
    name: string;
    url: string;
  };
  dominentpol: string;
  iaqi: { [key: string]: { v: number } };
  time: {
    s: string;
    tz: string;
    v: number;
    iso: string;
  };
}

export interface EnrichedStationDataPoint {
  name: string;
  uid: number;
  value: [number, number, number];
  details: DetailedStationData;
}
