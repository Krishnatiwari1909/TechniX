import { HourlyAQIData, RouteOption, AlertNotification } from '../types';

export const INITIAL_HOURLY_DATA: HourlyAQIData[] = [
  { time: '04:00', timestamp: 4, actualPM25: 32, predictedPM25: 35, confidenceMin: 28, confidenceMax: 42, temperature: 21, humidity: 82 },
  { time: '05:00', timestamp: 5, actualPM25: 38, predictedPM25: 41, confidenceMin: 32, confidenceMax: 48, temperature: 20, humidity: 85 },
  { time: '06:00', timestamp: 6, actualPM25: 56, predictedPM25: 54, confidenceMin: 45, confidenceMax: 65, temperature: 21, humidity: 80 },
  { time: '07:00', timestamp: 7, actualPM25: 84, predictedPM25: 82, confidenceMin: 70, confidenceMax: 95, temperature: 23, humidity: 74 },
  { time: '08:00', timestamp: 8, actualPM25: 142, predictedPM25: 138, confidenceMin: 120, confidenceMax: 158, temperature: 26, humidity: 65 },
  { time: '09:00', timestamp: 9, actualPM25: 168, predictedPM25: 165, confidenceMin: 145, confidenceMax: 185, temperature: 28, humidity: 58 },
  { time: '10:00', timestamp: 10, actualPM25: 124, predictedPM25: 126, confidenceMin: 105, confidenceMax: 145, temperature: 30, humidity: 52 },
  { time: '11:00', timestamp: 11, actualPM25: null, predictedPM25: 92, confidenceMin: 75, confidenceMax: 110, temperature: 31, humidity: 48 },
  { time: '12:00', timestamp: 12, actualPM25: null, predictedPM25: 68, confidenceMin: 55, confidenceMax: 82, temperature: 32, humidity: 45 },
  { time: '13:00', timestamp: 13, actualPM25: null, predictedPM25: 52, confidenceMin: 40, confidenceMax: 64, temperature: 33, humidity: 42 },
  { time: '14:00', timestamp: 14, actualPM25: null, predictedPM25: 45, confidenceMin: 35, confidenceMax: 58, temperature: 33, humidity: 40 },
  { time: '15:00', timestamp: 15, actualPM25: null, predictedPM25: 54, confidenceMin: 42, confidenceMax: 68, temperature: 32, humidity: 44 },
  { time: '16:00', timestamp: 16, actualPM25: null, predictedPM25: 78, confidenceMin: 62, confidenceMax: 96, temperature: 31, humidity: 50 },
  { time: '17:00', timestamp: 17, actualPM25: null, predictedPM25: 122, confidenceMin: 102, confidenceMax: 144, temperature: 29, humidity: 58 },
  { time: '18:00', timestamp: 18, actualPM25: null, predictedPM25: 154, confidenceMin: 130, confidenceMax: 178, temperature: 27, humidity: 66 },
  { time: '19:00', timestamp: 19, actualPM25: null, predictedPM25: 135, confidenceMin: 115, confidenceMax: 155, temperature: 26, humidity: 72 },
  { time: '20:00', timestamp: 20, actualPM25: null, predictedPM25: 98, confidenceMin: 80, confidenceMax: 118, temperature: 25, humidity: 76 }
];

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'route-polluted',
    title: 'Arterial Ring Expressway',
    subtitle: 'High Traffic & Diesel Soot Corridor',
    type: 'polluted',
    distanceKm: 8.4,
    durationMins: 22,
    avgPM25: 148,
    aqiScore: 195,
    inhalationDelta: '+180% Baseline',
    color: '#ef4444',
    coordinates: [
      [12.9352, 77.6245],
      [12.9410, 77.6275],
      [12.9520, 77.6350],
      [12.9645, 77.6430],
      [12.9750, 77.6520],
      [12.9860, 77.6630],
      [12.9980, 77.6740],
      [13.0080, 77.6890]
    ],
    waypoints: [
      { name: 'Koramangala Junction', lat: 12.9352, lng: 77.6245, pm25: 152 },
      { name: 'Indiranagar 100ft Ring', lat: 12.9645, lng: 77.6430, pm25: 168 },
      { name: 'Outer Ring Flyover', lat: 13.0080, lng: 77.6890, pm25: 142 }
    ],
    demographicAdvice: 'CAUTION: Severe diesel exhaust and fine particulate entrapment. Unsuitable for outdoor cardio or children.'
  },
  {
    id: 'route-clean',
    title: 'Parkside Greenway & Metro Corridor',
    subtitle: 'Low-Emission Tree-Canopy Bypass',
    type: 'clean',
    distanceKm: 9.2,
    durationMins: 26,
    avgPM25: 42,
    aqiScore: 68,
    inhalationDelta: '-72% Exposure',
    color: '#10b981',
    coordinates: [
      [12.9352, 77.6245],
      [12.9390, 77.6180],
      [12.9485, 77.6120],
      [12.9610, 77.6085],
      [12.9760, 77.6110],
      [12.9890, 77.6260],
      [12.9985, 77.6520],
      [13.0080, 77.6890]
    ],
    waypoints: [
      { name: 'Madhavan Park Canopy', lat: 12.9485, lng: 77.6120, pm25: 38 },
      { name: 'Cubbon Green Buffer Zone', lat: 12.9760, lng: 77.6110, pm25: 34 },
      { name: 'Binnamangala Metro Line', lat: 12.9985, lng: 77.6520, pm25: 46 }
    ],
    demographicAdvice: 'RECOMMENDED: Protected tree canopy filters 65% coarse and fine PM. Saves ~3.6µg inhaled toxins for your persona.'
  }
];

export const MOCK_ALERTS: AlertNotification[] = [
  {
    id: 'alert-1',
    level: 'critical',
    title: 'Severe Morning Thermal Inversion Detected',
    description: 'Ground-level temperature inversion trapped vehicular exhaust along Eastern Arterial between 07:45 AM and 09:15 AM.',
    timestamp: '15 mins ago',
    affectedDemographic: 'Active Runners & Children',
    actionRequired: 'Shift outdoor activity past 10:30 AM or route through Cubbon Greenway.',
    read: false
  },
  {
    id: 'alert-2',
    level: 'warning',
    title: 'Ozone Precursor Spike (Industrial Sector)',
    description: 'Solar radiation and stagnant wind patterns accelerating secondary oxidant formation.',
    timestamp: '1 hour ago',
    affectedDemographic: 'Commuters & Asthma Sufferers',
    actionRequired: 'Enable N95 / KF94 respirator or keep vehicle cabin AC on internal recirculation.',
    read: false
  },
  {
    id: 'alert-3',
    level: 'info',
    title: 'Clean Air Window Forecast: 12:30 PM - 03:30 PM',
    description: 'Thermal lift and mild westerly breeze will drop urban PM2.5 below 45 µg/m³ across the central valley.',
    timestamp: '3 hours ago',
    affectedDemographic: 'All Demographics',
    actionRequired: 'Ideal time window for errands, ventilation, and outdoor workouts.',
    read: true
  }
];

export const PERSONA_CONFIGS = {
  runner: {
    title: 'Endurance Runner',
    icon: 'Activity',
    tagline: 'High Ventilation & Peak Cardio',
    ventilationRate: '45-60 L/min',
    description: 'Inhales 4x to 6x the air volume of sedentary commuters. Highly susceptible to bronchoconstriction from fine PM2.5.',
    baseMultiplier: 2.1,
    accentColor: '#38bdf8',
    tips: [
      'Prioritize early morning runs before 06:45 AM or after 11:30 AM',
      'Target tree-dense corridors with dense biomass leaf interception',
      'Hydrate with antioxidant fluids to mitigate pulmonary oxidative stress'
    ]
  },
  parent: {
    title: 'Parent & Caregiver',
    icon: 'Baby',
    tagline: 'Developing Lungs & Low Stroller Height',
    ventilationRate: 'Rapid Breathing (Infants)',
    description: 'Stroller height sits directly at exhaust pipe dispersion altitude (0.3m - 0.9m). Developing alveoli are vulnerable to ultrafine black carbon.',
    baseMultiplier: 1.85,
    accentColor: '#ec4899',
    tips: [
      'Never idle strollers at busy road signal intersections',
      'Use breathable HEPA stroller covers during morning school drop-off',
      'Keep school transport windows closed during industrial highway transit'
    ]
  },
  commuter: {
    title: 'Urban Commuter',
    icon: 'Bike',
    tagline: 'Multi-Modal Daily Transit',
    ventilationRate: '18-25 L/min',
    description: 'Daily recurring exposure during morning and evening rush hour spikes. Exposure accumulates over thousands of lifetime hours.',
    baseMultiplier: 1.35,
    accentColor: '#10b981',
    tips: [
      'Shift departure by 25-35 minutes to bypass peak combustion waves',
      'Opt for elevated metro or tree-lined secondary streets',
      'Replace two-wheeler cloth masks with certified N95 / FFP2 filters'
    ]
  }
};

