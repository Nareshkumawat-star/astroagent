/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AstroAgent Astronomical Engine.
 * Implements high-precision Keplerian orbital elements and Lunar perturbations
 * for calculating geocentric positions of the Sun, Moon, and all major planets,
 * as well as Julian days, Local Sidereal Time, Ascendant, and House positions.
 */

export interface PlanetaryPosition {
  name: string;
  longitude: number; // 0 to 360 degrees
  sign: string;      // Zodiac sign name
  signSymbol: string;// Zodiac sign emoji/symbol
  degree: number;    // Degree within the sign (0 to 30)
  minute: number;    // Minutes of the degree
  house?: number;     // House position (1 to 12)
}

export interface BirthChartData {
  julianDay: number;
  localSiderealTime: number; // in degrees
  ascendant: PlanetaryPosition;
  midheaven: PlanetaryPosition;
  planets: PlanetaryPosition[];
  houses: { number: number; startLongitude: number; endLongitude: number; sign: string; signSymbol: string }[];
}

export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', start: 0 },
  { name: 'Taurus', symbol: '♉', start: 30 },
  { name: 'Gemini', symbol: '♊', start: 60 },
  { name: 'Cancer', symbol: '♋', start: 90 },
  { name: 'Leo', symbol: '♌', start: 120 },
  { name: 'Virgo', symbol: '♍', start: 150 },
  { name: 'Libra', symbol: '♎', start: 180 },
  { name: 'Scorpio', symbol: '♏', start: 210 },
  { name: 'Sagittarius', symbol: '♐', start: 240 },
  { name: 'Capricorn', symbol: '♑', start: 270 },
  { name: 'Aquarius', symbol: '♒', start: 300 },
  { name: 'Pisces', symbol: '♓', start: 330 },
];

export function getZodiacSign(longitude: number) {
  const normLong = (longitude % 360 + 360) % 360;
  const index = Math.floor(normLong / 30);
  const sign = ZODIAC_SIGNS[index] || ZODIAC_SIGNS[0];
  const dLong = normLong - sign.start;
  const degree = Math.floor(dLong);
  const minute = Math.floor((dLong - degree) * 60);
  return {
    name: sign.name,
    symbol: sign.symbol,
    degree,
    minute,
  };
}

// Julian Day Calculation from UTC
export function calculateJulianDay(dateStr: string, timeStr: string): number {
  // dateStr YYYY-MM-DD, timeStr HH:MM
  const parts = dateStr.split('-');
  const timeParts = timeStr.split(':');
  if (parts.length !== 3 || timeParts.length < 2) {
    return 2451545.0; // J2000 fallback
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const min = parseInt(timeParts[1], 10);
  const decimalHour = hour + min / 60.0;

  let Y = year;
  let M = month;
  if (month <= 2) {
    Y -= 1;
    M += 12;
  }

  const A = Math.floor(Y / 100);
  const B = Math.floor(A / 4);
  const C = 2 - A + B;
  const E = Math.floor(365.25 * (Y + 4716));
  const F = Math.floor(30.6001 * (M + 1));
  const jd = C + day + decimalHour / 24.0 + E + F - 1524.5;
  return jd;
}

// Orbital elements structure
interface KeplerElements {
  a: number; // Semi-major axis (AU)
  e: number; // Eccentricity
  i: number; // Inclination (deg)
  L: number; // Mean Longitude (deg)
  w: number; // Longitude of perihelion (deg)
  node: number; // Longitude of ascending node (deg)
  
  // Century rates (per cy)
  da: number;
  de: number;
  di: number;
  dL: number;
  dw: number;
  dnode: number;
}

// Keplerian elements at J2000.0 from NASA JPL
const PLANET_ELEMENTS: Record<string, KeplerElements> = {
  mercury: {
    a: 0.38709893, e: 0.20563069, i: 7.00487, L: 252.25084, w: 77.45645, node: 48.33167,
    da: 0, de: 0.00002040, di: -0.00594, dL: 149472.67411, dw: 0.15901, dnode: -0.12537
  },
  venus: {
    a: 0.72333199, e: 0.00677323, i: 3.39471, L: 181.97973, w: 131.53298, node: 76.68069,
    da: 0, de: -0.00004776, di: -0.00079, dL: 58517.81538, dw: 0.00213, dnode: -0.27769
  },
  earth: { // Heliocentric Earth/Moon barycenter
    a: 1.00000011, e: 0.01671022, i: 0.00005, L: 100.46435, w: 102.94719, node: -11.26064,
    da: 0, de: -0.00003804, di: -0.01300, dL: 35999.37288, dw: 0.32327, dnode: -0.41311
  },
  mars: {
    a: 1.52366231, e: 0.09341233, i: 1.85061, L: 355.45332, w: 336.04084, node: 49.57854,
    da: 0, de: 0.00011902, di: -0.00724, dL: 19140.30268, dw: 0.44383, dnode: -0.29257
  },
  jupiter: {
    a: 5.20336301, e: 0.04839266, i: 1.30530, L: 34.40438, w: 14.75385, node: 100.55615,
    da: 0.00060737, de: -0.00012880, di: -0.00415, dL: 3034.74612, dw: 0.19112, dnode: 0.20380
  },
  saturn: {
    a: 9.53707032, e: 0.05415060, i: 2.48446, L: 49.94432, w: 92.43194, node: 113.71504,
    da: -0.00301530, de: -0.00036762, di: 0.00193, dL: 1222.11379, dw: -0.41897, dnode: -0.28853
  },
  uranus: {
    a: 19.19126393, e: 0.04716771, i: 0.76986, L: 313.23218, w: 170.96424, node: 74.22988,
    da: 0.00152042, de: -0.00001915, di: -0.00257, dL: 428.48202, dw: 0.40805, dnode: -0.09457
  },
  neptune: {
    a: 30.06896348, e: 0.00858587, i: 1.76917, L: 304.88003, w: 44.97135, node: 131.72169,
    da: -0.00125196, de: 0.00002514, di: -0.00001, dL: 218.45945, dw: -0.32241, dnode: -0.00259
  },
  pluto: {
    a: 39.48168677, e: 0.24880766, i: 17.14175, L: 238.92881, w: 224.06676, node: 110.30347,
    da: -0.00076912, de: 0.00006465, di: 0.00307, dL: 145.20780, dw: -0.04063, dnode: -0.01183
  }
};

// Help solve Kepler's Equation: E - e * sin(E) = M
function solveKepler(M_rad: number, e: number): number {
  let E = M_rad;
  const tolerance = 1e-6;
  const maxIterations = 100;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const dE = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) {
      break;
    }
  }
  return E;
}

// Get the heliocentric coordinates (X, Y, Z) in the ecliptic frame
function getHeliocentricCoordinates(planet: string, T: number) {
  const el = PLANET_ELEMENTS[planet];
  if (!el) {
    return { x: 0, y: 0, z: 0 };
  }

  // Linear expansion with century rates
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const i = (el.i + el.di * T) * (Math.PI / 180);
  const L = (el.L + el.dL * T) * (Math.PI / 180);
  const w = (el.w + el.dw * T) * (Math.PI / 180);
  const node = (el.node + el.dnode * T) * (Math.PI / 180);

  const omega = w - node;
  const M = L - w;

  // Settle mean anomaly in interval [-PI, PI]
  let M_norm = M % (2 * Math.PI);
  if (M_norm < 0) M_norm += 2 * Math.PI;

  const E = solveKepler(M_norm, e);

  // Compute positions in orbital plane coordinates (x', y')
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate to heliocentric ecliptic coordinates (x, y, z)
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x = xp * (cosOmega * cosNode - sinOmega * sinNode * cosI) - yp * (sinOmega * cosNode + cosOmega * sinNode * cosI);
  const y = xp * (cosOmega * sinNode + sinOmega * cosNode * cosI) - yp * (sinOmega * sinNode - cosOmega * cosNode * cosI);
  const z = xp * (sinOmega * sinI) + yp * (cosOmega * sinI);

  return { x, y, z };
}

// Compute geocentric longitude for any planet
export function computePlanetGeocentric(planet: string, JD: number): number {
  const T = (JD - 2451545.0) / 36525.0; // centuries since J2000.0

  if (planet === 'sun') {
    // Sun position is the inverse of the Earth's geocentric position
    const earth = getHeliocentricCoordinates('earth', T);
    const x_geo = -earth.x;
    const y_geo = -earth.y;
    let lon = Math.atan2(y_geo, x_geo) * (180.0 / Math.PI);
    return (lon % 360 + 360) % 360;
  }

  if (planet === 'moon') {
    // High accuracy Moon model using major lunar series terms (Brown's Simplified)
    const L_prime = (218.316 + 481267.881 * T) * (Math.PI / 180); // Moon mean longitude
    const D = (297.850 + 445267.111 * T) * (Math.PI / 180);       // Moon mean elongation
    const M_sun = (357.529 + 35999.050 * T) * (Math.PI / 180);    // Sun mean anomaly
    const M_moon = (134.963 + 477198.867 * T) * (Math.PI / 180);  // Moon mean anomaly
    const F = (93.272 + 483202.018 * T) * (Math.PI / 180);        // Moon argument of latitude

    // Major lunar inequality terms in radians
    const dLon = 
      6.289 * Math.sin(M_moon) +
      1.274 * Math.sin(2 * D - M_moon) +
      0.658 * Math.sin(2 * D) +
      0.214 * Math.sin(2 * M_moon) -
      0.186 * Math.sin(M_sun) -
      0.114 * Math.sin(2 * F) +
      0.151 * Math.sin(2 * D - M_sun) +
      0.143 * Math.sin(D) +
      0.057 * Math.sin(2 * D - M_moon - M_sun) +
      0.052 * Math.sin(2 * D + M_moon);

    const lonDeg = (L_prime * (180 / Math.PI)) + dLon;
    return (lonDeg % 360 + 360) % 360;
  }

  // Other planets (heliocentric planet x, y, z - heliocentric earth x, y, z)
  const pCoords = getHeliocentricCoordinates(planet, T);
  const eCoords = getHeliocentricCoordinates('earth', T);

  const x_g = pCoords.x - eCoords.x;
  const y_g = pCoords.y - eCoords.y;

  let geoLon = Math.atan2(y_g, x_g) * (180.0 / Math.PI);
  return (geoLon % 360 + 360) % 360;
}

// Computes GMT Sidereal Time (GMST) and Local Sidereal Time (LST)
export function getSiderealTime(JD: number, longitude: number): { gmst: number; lst: number } {
  const T = (JD - 2451545.0) / 36525.0;

  // GMST precise formulation
  let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  gmst = (gmst % 360 + 360) % 360;

  let lst = gmst + longitude;
  lst = (lst % 360 + 360) % 360;

  return { gmst, lst };
}

// Compute Ascendant and MC given Local Sidereal Time (LST) and Latitude
export function calculateAscendantAndMC(LST: number, lat: number, JD: number): { ascendant: number; mc: number } {
  const T = (JD - 2451545.0) / 36525.0;
  
  // Obliquity of plane of earth
  const epsilon = (23.439291 - 0.013004167 * T) * (Math.PI / 180);

  const RAMC_rad = LST * (Math.PI / 180);
  const lat_rad = lat * (Math.PI / 180);

  // Compute MC Longitude
  const numMC = Math.sin(RAMC_rad);
  const denMC = Math.cos(RAMC_rad) * Math.cos(epsilon);
  let mc = Math.atan2(numMC, denMC) * (180 / Math.PI);
  mc = (mc % 360 + 360) % 360;

  // Compute Ascendant Longitude
  const numAsc = cosDeg(LST);
  const denAsc = -sinDeg(LST) * Math.cos(epsilon) - Math.tan(lat_rad) * Math.sin(epsilon);
  let asc = Math.atan2(numAsc, denAsc) * (180 / Math.PI);
  asc = (asc % 360 + 360) % 360;

  return { ascendant: asc, mc };
}

function sinDeg(d: number) { return Math.sin(d * Math.PI / 180); }
function cosDeg(d: number) { return Math.cos(d * Math.PI / 180); }

// Compute standard Equal House structures (12 houses) starting from Ascendant
export function getEqualHouses(ascendant: number) {
  const houses = [];
  for (let i = 1; i <= 12; i++) {
    const start = (ascendant + (i - 1) * 30) % 360;
    const end = (ascendant + i * 30) % 360;
    const info = getZodiacSign(start);
    houses.push({
      number: i,
      startLongitude: start,
      endLongitude: end,
      sign: info.name,
      signSymbol: info.symbol,
    });
  }
  return houses;
}

// Match planets into calculated houses
export function findPlanetHouse(planetLon: number, ascendant: number): number {
  const relLon = (planetLon - ascendant % 360 + 365) % 360;
  return Math.floor(relLon / 30) + 1;
}

// Compile a complete Birth Chart
export function computeBirthChart(dateStr: string, timeStr: string, lat: number, lon: number): BirthChartData {
  const jd = calculateJulianDay(dateStr, timeStr);
  const { lst } = getSiderealTime(jd, lon);

  const { ascendant: asc, mc } = calculateAscendantAndMC(lst, lat, jd);

  const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  const planets: PlanetaryPosition[] = planetKeys.map(key => {
    const long = computePlanetGeocentric(key, jd);
    const zodiac = getZodiacSign(long);
    const houseNum = findPlanetHouse(long, asc);

    return {
      name: key.toUpperCase(),
      longitude: long,
      sign: zodiac.name,
      signSymbol: zodiac.symbol,
      degree: zodiac.degree,
      minute: zodiac.minute,
      house: houseNum
    };
  });

  const ascZodiac = getZodiacSign(asc);
  const mcZodiac = getZodiacSign(mc);

  const ascVal: PlanetaryPosition = {
    name: 'ASCENDANT',
    longitude: asc,
    sign: ascZodiac.name,
    signSymbol: ascZodiac.symbol,
    degree: ascZodiac.degree,
    minute: ascZodiac.minute,
    house: 1
  };

  const mcVal: PlanetaryPosition = {
    name: 'MIDHEAVEN',
    longitude: mc,
    sign: mcZodiac.name,
    signSymbol: mcZodiac.symbol,
    degree: mcZodiac.degree,
    minute: mcZodiac.minute,
    house: 10
  };

  const houses = getEqualHouses(asc);

  return {
    julianDay: jd,
    localSiderealTime: lst,
    ascendant: ascVal,
    midheaven: mcVal,
    planets,
    houses
  };
}

// Compute active transit configurations comparing current transiting positions back to the natal chart
export interface TransitConfig {
  planet: string;
  natalSign: string;
  transitingSign: string;
  type: string; // Aspect type (Conjunction, Opposition, Trine, Square, Sextile)
  description: string;
}

export function getDailyTransits(natalChart: BirthChartData, currentDateStr: string, currentTimeStr: string): TransitConfig[] {
  const transitChart = computeBirthChart(currentDateStr, currentTimeStr, 0, 0); // reference 0,0 for standard transit chart

  const transits: TransitConfig[] = [];

  // Match main transiting nodes to natal positions and flag aspects within a small orb of +/- 5 degrees
  for (const tPlanet of transitChart.planets) {
    for (const nPlanet of natalChart.planets) {
      const diff = Math.abs(tPlanet.longitude - nPlanet.longitude);
      const angle = diff > 180 ? 360 - diff : diff;

      let aspectType = '';
      let description = '';

      if (angle <= 6) {
        aspectType = 'Conjunction';
        description = `Transiting ${tPlanet.name} aligns directly with your natal ${nPlanet.name}, merging their energies and initiating powerful new cycles.`;
      } else if (Math.abs(angle - 180) <= 6) {
        aspectType = 'Opposition';
        description = `Transiting ${tPlanet.name} stands directly opposite your natal ${nPlanet.name}, representing peak external themes or interpersonal dynamics.`;
      } else if (Math.abs(angle - 120) <= 6) {
        aspectType = 'Trine';
        description = `Transiting ${tPlanet.name} forms a harmonious trine with your natal ${nPlanet.name}, bringing ease, flowing guidance, and positive opportunity.`;
      } else if (Math.abs(angle - 90) <= 6) {
        aspectType = 'Square';
        description = `Transiting ${tPlanet.name} squares your natal ${nPlanet.name}, introducing challenges, tension, and a strong call for adjustment.`;
      } else if (Math.abs(angle - 60) <= 6) {
        aspectType = 'Sextile';
        description = `Transiting ${tPlanet.name} sextiles your natal ${nPlanet.name}, offering supportive openings and practical cooperative opportunities.`;
      }

      if (aspectType) {
        transits.push({
          planet: tPlanet.name,
          natalSign: nPlanet.sign,
          transitingSign: tPlanet.sign,
          type: aspectType,
          description
        });
      }
    }
  }

  return transits;
}
