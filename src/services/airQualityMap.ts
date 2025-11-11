import type {
  AirQualityData,
  BasicStationData,
  DetailedStationData,
} from "@/types/components/airQualityMap/airQualityMap";

const AQICN_API_TOKEN = import.meta.env.VITE_AQICN_TOKEN;

export const searchLocationBounds = async (
  query: string,
): Promise<google.maps.LatLngBounds> => {
  if (!query) throw new Error("O termo de busca não pode ser vazio.");
  const searchUrl = `https://api.waqi.info/search/?token=${AQICN_API_TOKEN}&keyword=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl);
  const result = await response.json();

  if (result.status !== "ok" || result.data.length === 0) {
    throw new Error("Nenhuma estação encontrada para esta busca.");
  }

  const bounds = new google.maps.LatLngBounds();
  result.data.forEach((station: AirQualityData) => {
    if (station.station?.geo) {
      bounds.extend(
        new google.maps.LatLng(station.station.geo[0], station.station.geo[1]),
      );
    }
  });
  return bounds;
};

export const fetchVisibleStations = async (
  boundsStr: string,
): Promise<BasicStationData[]> => {
  if (!boundsStr) return [];
  if (!AQICN_API_TOKEN)
    throw new Error("Chave de API do AQICN não encontrada.");

  const url = `https://api.waqi.info/v2/map/bounds/?latlng=${boundsStr}&token=${AQICN_API_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Erro na API de limites: ${response.statusText}`);
  const result = await response.json();
  if (result.status !== "ok")
    throw new Error(`API de limites retornou um erro: ${result.data}`);
  return result.data;
};

export const fetchStationDetails = async (
  lat: number,
  lon: number,
): Promise<DetailedStationData> => {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_API_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Erro ao buscar detalhes da estação (${lat}, ${lon})`);
  const result = await response.json();
  if (result.status !== "ok")
    throw new Error(`API de detalhes retornou um erro: ${result.data}`);
  return result.data;
};
