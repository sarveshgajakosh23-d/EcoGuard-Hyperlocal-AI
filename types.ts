export interface Sensor {
  id: string;
  ward_name: string;
  lat: number;
  lng: number;
}

export interface Reading {
  id: number;
  sensor_id: string;
  ward_name: string;
  pm25: number;
  pm10: number;
  co2: number;
  temp: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  timestamp: string;
}

export interface CitizenReport {
  id: number;
  lat: number;
  lng: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface SourceProbability {
  type: string;
  probability: number;
}

export interface WardSourceAnalysis {
  ward: string;
  sources: SourceProbability[];
}

export interface EmergencyAlert {
  ward: string;
  level: 'hazardous' | 'warning';
  predictedAQI: number;
  timeframe: string;
  actions: string[];
}

export interface ExposureMetric {
  ward: string;
  hazardousDurationMinutes: number;
}

export interface AIInsight {
  hotspots: string[];
  prediction: string;
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  sourceAnalysis: WardSourceAnalysis[];
  alerts: EmergencyAlert[];
}
