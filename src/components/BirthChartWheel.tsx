/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AstroAgent Interactive Astrology Birth Chart Wheel Component.
 * High-precision vector projection, de-conflicting overlapping placements,
 * equal house cusps, center core major aspects, and responsive tooltips.
 */

import { useState, useMemo } from 'react';
import { 
  Compass, 
  HelpCircle, 
  Sun, 
  Star, 
  TrendingUp 
} from 'lucide-react';

interface PlanetaryPosition {
  name: string;
  longitude: number;
  sign: string;
  signSymbol: string;
  degree: number;
  minute: number;
  house?: number;
}

interface BirthChartData {
  julianDay: number;
  localSiderealTime: number;
  ascendant: PlanetaryPosition;
  midheaven: PlanetaryPosition;
  planets: PlanetaryPosition[];
  houses: { number: number; startLongitude: number; endLongitude: number; sign: string; signSymbol: string }[];
}

interface BirthChartWheelProps {
  chart: BirthChartData;
  language?: 'en' | 'hi';
  hideTelemetry?: boolean;
}

// Zodiac definitions with element associations and color schemes
const ZODIAC_METADATA = [
  { name: 'Aries', symbol: '♈', element: 'fire', color: '#f87171' }, // Red
  { name: 'Taurus', symbol: '♉', element: 'earth', color: '#fbbf24' }, // Amber
  { name: 'Gemini', symbol: '♊', element: 'air', color: '#38bdf8' }, // Sky
  { name: 'Cancer', symbol: '♋', element: 'water', color: '#818cf8' }, // Indigo
  { name: 'Leo', symbol: '♌', element: 'fire', color: '#f87171' },
  { name: 'Virgo', symbol: '♍', element: 'earth', color: '#fbbf24' },
  { name: 'Libra', symbol: '♎', element: 'air', color: '#38bdf8' },
  { name: 'Scorpio', symbol: '♏', element: 'water', color: '#818cf8' },
  { name: 'Sagittarius', symbol: '♐', element: 'fire', color: '#f87171' },
  { name: 'Capricorn', symbol: '♑', element: 'earth', color: '#fbbf24' },
  { name: 'Aquarius', symbol: '♒', element: 'air', color: '#38bdf8' },
  { name: 'Pisces', symbol: '♓', element: 'water', color: '#818cf8' },
];

export default function BirthChartWheel({ chart, language = 'en', hideTelemetry = false }: BirthChartWheelProps) {
  // Tooltip & highlight state
  const [hoveredNode, setHoveredNode] = useState<{
    type: 'planet' | 'house' | 'sign' | 'aspect';
    name: string;
    details: string;
    longitude?: number;
    house?: number;
    sign?: string;
    degreeText?: string;
  } | null>(null);

  const ascLongitude = chart.ascendant.longitude;

  // Projection math: Translate absolute longitude (0-360) to SVG screen angle (degrees)
  // Traditional Western charts put ASC on the horizontal left (9 o'clock) which of polar coordinates is 180 deg.
  // Rotation is counter-clockwise, meaning high longitudes rotate downwards/left.
  // Screen SVG coordinates also invert standard y-axis.
  const getScreenAngle = (longitude: number): number => {
    const angle = 180 - (longitude - ascLongitude);
    return (angle % 360 + 360) % 360;
  };

  // Convert polar coordinates to cartesian (x, y) relative to SVG origin (250, 250)
  const getCartesian = (angle: number, radius: number) => {
    const rads = (angle * Math.PI) / 180;
    return {
      x: 250 + radius * Math.cos(rads),
      y: 250 - radius * Math.sin(rads) // invert Y for SVG drawing
    };
  };

  // Staggering logic to deconflict planet indicators that are close to each other
  const deconflictedPlanets = useMemo(() => {
    // Clone and sort planets by longitude
    const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
    const results = sorted.map(p => ({
      ...p,
      radius: 155 // Default radius
    }));

    // Perform multiple passes of separation to stagger overlapping elements
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const dist = Math.abs(results[i].longitude - results[j].longitude);
          const polarDist = dist > 180 ? 360 - dist : dist;

          if (polarDist < 7.5 && results[i].radius === results[j].radius) {
            // Push the higher longevity planet outward
            results[j].radius = results[i].radius === 155 ? 180 : 130;
          }
        }
      }
    }
    return results;
  }, [chart.planets]);

  // Compute Major Planetary Aspects inside the inner core cavity (radius <= 80)
  const planetaryAspects = useMemo(() => {
    const aspectsList: {
      p1: string;
      p2: string;
      angle: number;
      type: 'Conjunction' | 'Opposition' | 'Trine' | 'Square' | 'Sextile';
      color: string;
      dasharray?: string;
      p1Long: number;
      p2Long: number;
    }[] = [];

    const pArray = chart.planets;

    for (let i = 0; i < pArray.length; i++) {
      for (let j = i + 1; j < pArray.length; j++) {
        const diff = Math.abs(pArray[i].longitude - pArray[j].longitude);
        const angle = diff > 180 ? 360 - diff : diff;

        let type: 'Conjunction' | 'Opposition' | 'Trine' | 'Square' | 'Sextile' | null = null;
        let color = '';
        let dasharray = '';

        if (angle <= 6) {
          type = 'Conjunction';
          color = '#d8b4fe'; // Purple
        } else if (Math.abs(angle - 180) <= 6) {
          type = 'Opposition';
          color = '#f97316'; // Orange (tension)
        } else if (Math.abs(angle - 120) <= 6) {
          type = 'Trine';
          color = '#10b981'; // Emerald (harmony)
        } else if (Math.abs(angle - 90) <= 6) {
          type = 'Square';
          color = '#ef4444'; // Red (friction)
        } else if (Math.abs(angle - 60) <= 6) {
          type = 'Sextile';
          color = '#06b6d4'; // Cyan (opportunity)
          dasharray = '3,3';
        }

        if (type) {
          aspectsList.push({
            p1: pArray[i].name,
            p2: pArray[j].name,
            angle,
            type,
            color,
            dasharray,
            p1Long: pArray[i].longitude,
            p2Long: pArray[j].longitude
          });
        }
      }
    }

    return aspectsList;
  }, [chart.planets]);

  // Handle click to explore / feed prompt to search base
  const handleElementHover = (
    type: 'planet' | 'house' | 'sign' | 'aspect',
    name: string,
    details: string,
    long?: number,
    house?: number,
    sign?: string,
    degreeText?: string
  ) => {
    setHoveredNode({
      type,
      name,
      details,
      longitude: long,
      house,
      sign,
      degreeText
    });
  };

  // Get responsive color for a planet node

  const getPlanetBg = (name: string) => {
    switch (name) {
      case 'SUN': return 'bg-saffron-50 border-saffron-200 text-saffron-600';
      case 'MOON': return 'bg-sky-50 border-sky-200 text-sky-600';
      case 'MERCURY': return 'bg-teal-50 border-teal-200 text-teal-600';
      case 'VENUS': return 'bg-rose-50 border-rose-200 text-rose-600';
      case 'MARS': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'JUPITER': return 'bg-saffron-100 border-saffron-300 text-maroon-600 font-bold';
      case 'SATURN': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'URANUS': return 'bg-cyan-50 border-cyan-200 text-cyan-600';
      case 'NEPTUNE': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'PLUTO': return 'bg-purple-50 border-purple-200 text-purple-600';
      default: return 'bg-sand-100 border-sand-200 text-maroon-700';
    }
  };

  return (
    <div id="astrowheel-dashboard-module" className={hideTelemetry ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
      
      {/* 1. INTERACTIVE VECTOR CHART WHEEL */}
      <div className={hideTelemetry ? "w-full flex flex-col items-center bg-sand-50/90 border border-maroon-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden" : "lg:col-span-7 flex flex-col items-center bg-sand-50/90 border border-maroon-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden"}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-4 h-4 text-saffron-500 animate-spin-slow" />
          <span className="text-xs font-serif font-semibold text-maroon-600 uppercase tracking-wider">
            {language === 'hi' ? 'गतिशील जन्म कुंडली ज्यामिति' : 'Dynamic Natal Geometry'}
          </span>
        </div>

        {/* SVG Zodiac Wheel viewport */}
        <div className="w-full max-w-[480px] aspect-square relative select-none">
          <svg 
            id="natal-svg-wheel" 
            viewBox="0 0 500 500" 
            className="w-full h-full drop-shadow-md"
          >
            {/* BACKGROUND MATRIX GRID */}
            <circle cx="250" cy="250" r="240" fill="#fffdfa" stroke="#6d1a08" strokeWidth="0.8" strokeOpacity="0.12" />
            <circle cx="250" cy="250" r="210" fill="transparent" stroke="#6d1a08" strokeWidth="0.8" strokeOpacity="0.12" />
            <circle cx="250" cy="250" r="145" fill="transparent" stroke="#6d1a08" strokeWidth="0.8" strokeOpacity="0.1" />
            <circle cx="250" cy="250" r="80" fill="#fffaf2" stroke="#6d1a08" strokeWidth="1" strokeOpacity="0.25" />

            {/* ZODIAC SIGNS OUTER SECTORS & BOUNDARIES */}
            {ZODIAC_METADATA.map((sign, idx) => {
              const startLong = idx * 30;
              const angleStart = getScreenAngle(startLong);
              const angleEnd = getScreenAngle((idx + 1) * 30);
              const ptStartInner = getCartesian(angleStart, 210);
              const ptStartOuter = getCartesian(angleStart, 240);

              // Calculate middle point of sector for placing Unicode symbol & hovering elements
              const angleMid = getScreenAngle(idx * 30 + 15);
              const ptSymbol = getCartesian(angleMid, 225);

              const fireEarthAirWaterHi: Record<string, string> = {
                fire: 'अग्नि (Fire)',
                earth: 'पृथ्वी (Earth)',
                air: 'वायु (Air)',
                water: 'जल (Water)'
              };

              // Map sign names to Hindi
              const signNamesHi: Record<string, string> = {
                Aries: 'मेष (Aries)',
                Taurus: 'वृषभ (Taurus)',
                Gemini: 'मिथुन (Gemini)',
                Cancer: 'कर्क (Cancer)',
                Leo: 'सिंह (Leo)',
                Virgo: 'कन्या (Virgo)',
                Libra: 'तुला (Libra)',
                Scorpio: 'वृश्चिक (Scorpio)',
                Sagittarius: 'धनु (Sagittarius)',
                Capricorn: 'मकर (Capricorn)',
                Aquarius: 'कुंभ (Aquarius)',
                Pisces: 'मीन (Pisces)'
              };

              const signNameText = language === 'hi' ? (signNamesHi[sign.name] || sign.name) : sign.name;

              return (
                <g key={sign.name} className="group/sign">
                  {/* Sector Boundary separating signs */}
                  <line 
                    x1={ptStartInner.x} 
                    y1={ptStartInner.y} 
                    x2={ptStartOuter.x} 
                    y2={ptStartOuter.y} 
                    stroke="#6d1a08" 
                    strokeWidth="1" 
                    strokeOpacity="0.15" 
                  />

                  {/* Highlight trigger for the sector */}
                  <path
                    d={`
                      M ${getCartesian(angleStart, 210).x} ${getCartesian(angleStart, 210).y}
                      L ${getCartesian(angleStart, 240).x} ${getCartesian(angleStart, 240).y}
                      A 240 240 0 0 1 ${getCartesian(angleEnd, 240).x} ${getCartesian(angleEnd, 240).y}
                      L ${getCartesian(angleEnd, 210).x} ${getCartesian(angleEnd, 210).y}
                      A 210 210 0 0 0 ${getCartesian(angleStart, 210).x} ${getCartesian(angleStart, 210).y}
                    `}
                    fill={sign.color}
                    fillOpacity="0.01"
                    className="cursor-pointer hover:fill-opacity-10 transition-all duration-300"
                    onMouseEnter={() => handleElementHover(
                      'sign',
                      signNameText,
                      language === 'hi'
                        ? `इसमें ${fireEarthAirWaterHi[sign.element] || sign.element} तत्व निहित है। सूर्य ग्रहण मार्ग के पूर्ण चाप में ${startLong}° से ${startLong + 30}° निर्देशांक तक फैला हुआ है।`
                        : `Wields the element of ${sign.element.toUpperCase()}. Occupying coordinates ${startLong}° to ${startLong + 30}° on the absolute ecliptic band.`,
                      startLong,
                      undefined,
                      sign.name
                    )}
                  />

                  {/* Zodiac Symbol Glyph */}
                  <text
                    x={ptSymbol.x}
                    y={ptSymbol.y}
                    fill={sign.color}
                    fontSize="13px"
                    fontWeight="medium"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none group-hover/sign:scale-125 transition-transform duration-200"
                  >
                    {sign.symbol}
                  </text>
                </g>
              );
            })}

            {/* COMPUTED HOUSE SYSTEMS DESIGN */}
            {chart.houses.map((house) => {
              const startAngle = getScreenAngle(house.startLongitude);
              const innerPt = getCartesian(startAngle, 80);
              const outerPt = getCartesian(startAngle, 210);

              // Position label
              const labelAngle = getScreenAngle((house.startLongitude + house.endLongitude) / 2);
              const ptLabel = getCartesian(labelAngle, 98);

              const signNamesHi: Record<string, string> = {
                Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
              };

              const houseSignName = language === 'hi' ? (signNamesHi[house.sign] || house.sign) : house.sign;

              return (
                <g key={house.number} className="group/house">
                  {/* House boundary cusp */}
                  <line
                    x1={innerPt.x}
                    y1={innerPt.y}
                    x2={outerPt.x}
                    y2={outerPt.y}
                    stroke="#6d1a08"
                    strokeWidth="0.8"
                    strokeOpacity="0.15"
                    strokeDasharray={house.number === 1 || house.number === 10 ? undefined : "2,2"}
                  />

                  {/* House Sector Hover area */}
                  <path
                    d={`
                      M ${getCartesian(startAngle, 85).x} ${getCartesian(startAngle, 85).y}
                      L ${getCartesian(startAngle, 205).x} ${getCartesian(startAngle, 205).y}
                      A 205 205 0 0 1 ${getCartesian(getScreenAngle(house.endLongitude), 205).x} ${getCartesian(getScreenAngle(house.endLongitude), 205).y}
                      L ${getCartesian(getScreenAngle(house.endLongitude), 85).x} ${getCartesian(getScreenAngle(house.endLongitude), 85).y}
                      A 85 85 0 0 0 ${getCartesian(startAngle, 85).x} ${getCartesian(startAngle, 85).y}
                    `}
                    fill="#ff4b26"
                    fillOpacity="0"
                    className="cursor-pointer hover:fill-opacity-[0.03] transition-all duration-300"
                    onMouseEnter={() => handleElementHover(
                      'house',
                      language === 'hi' ? `भाव ${house.number}` : `House ${house.number}`,
                      language === 'hi'
                        ? `${Math.floor(house.startLongitude)}° से ${Math.floor(house.endLongitude)}° तक फैला हुआ है। राशि ${houseSignName} ${house.signSymbol} में स्थित। जीवन के मुख्य रचनात्मक और गतिशील आयामों को नियंत्रित करता है।`
                        : `Spans from ${Math.floor(house.startLongitude)}° to ${Math.floor(house.endLongitude)}°. Positioned in sign ${house.sign} ${house.signSymbol}. Governs key existential themes.`,
                      house.startLongitude,
                      house.number,
                      house.sign
                    )}
                  />

                  {/* Little House Number Text */}
                  <text
                    x={ptLabel.x}
                    y={ptLabel.y}
                    fill="#8b5e3c"
                    fontSize="9px"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pointer-events-none hover:fill-saffron-600"
                  >
                    {house.number}
                  </text>
                </g>
              );
            })}

            {/* CORE ASPECT SYMMETRY PATHS */}
            {planetaryAspects.map((aspect, idx) => {
              const pt1 = getCartesian(getScreenAngle(aspect.p1Long), 76);
              const pt2 = getCartesian(getScreenAngle(aspect.p2Long), 76);

              const aspectTypesHi: Record<string, string> = {
                Conjunction: 'युति (Conjunction)',
                Opposition: 'प्रतियुति (Opposition)',
                Trine: 'त्रिकोण योग (Trine)',
                Square: 'केन्द्र योग (Square)',
                Sextile: 'द्विद्वादश योग (Sextile)'
              };

              const aspectNameText = language === 'hi' 
                ? `${aspectTypesHi[aspect.type] || aspect.type} - ${aspect.p1} <> ${aspect.p2}` 
                : `${aspect.type} - ${aspect.p1} <> ${aspect.p2}`;

              return (
                <line
                  key={`${aspect.p1}-${aspect.p2}-${idx}`}
                  x1={pt1.x}
                  y1={pt1.y}
                  x2={pt2.x}
                  y2={pt2.y}
                  stroke={aspect.color}
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                  strokeDasharray={aspect.dasharray}
                  className="cursor-pointer hover:stroke-width-3 hover:stroke-opacity-95 transition-all duration-200"
                  onMouseEnter={() => handleElementHover(
                    'aspect',
                    aspectNameText,
                    language === 'hi'
                      ? `जन्मकालीन ${aspect.p1} और ${aspect.p2} के बीच बनने वाला ${aspect.angle.toFixed(1)}° का गतिशील ज्यामितीय कोण। महत्वपूर्ण मानसिक संश्लेषण को इंगित करने वाला सटीक संरेखण।`
                      : `Deep aspect geometric angle of ${aspect.angle.toFixed(1)}° formed between natal ${aspect.p1} and ${aspect.p2}. Perfect alignment indicating vital psychic synthesis.`,
                    aspect.angle
                  )}
                />
              );
            })}

            {/* PRINCIPAL AXIS SYSTEMS vectors: ASCENDANT AND MIDHEAVEN */}
            {(() => {
              // ASC axis line at angle 180 (exact middle-left horizon)
              const ascPtStart = getCartesian(180, 245);
              const ascPtEnd = getCartesian(180, 80);

              // MC angle
              const mcAngle = getScreenAngle(chart.midheaven.longitude);
              const mcPtStart = getCartesian(mcAngle, 245);
              const mcPtEnd = getCartesian(mcAngle, 80);

              return (
                <g>
                  {/* ASC horizontal vector */}
                  <line 
                    x1={ascPtStart.x} 
                    y1={ascPtStart.y} 
                    x2={ascPtEnd.x} 
                    y2={ascPtEnd.y} 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeOpacity="0.8" 
                  />
                  {/* ASC Arrowhead near outer rim */}
                  <polygon
                    points={`
                      ${ascPtStart.x},${ascPtStart.y}
                      ${ascPtStart.x + 8},${ascPtStart.y - 4}
                      ${ascPtStart.x + 8},${ascPtStart.y + 4}
                    `}
                    fill="#10b981"
                  />
                  {/* ASC text indicator */}
                  <text
                    x={ascPtStart.x - 14}
                    y={ascPtStart.y}
                    fill="#10b981"
                    fontSize="11px"
                    fontWeight="bold"
                    textAnchor="end"
                    dominantBaseline="central"
                  >
                    ASC
                  </text>

                  {/* MC midheaven vector */}
                  <line 
                    x1={mcPtStart.x} 
                    y1={mcPtStart.y} 
                    x2={mcPtEnd.x} 
                    y2={mcPtEnd.y} 
                    stroke="#f43f5e" 
                    strokeWidth="2" 
                    strokeOpacity="0.8" 
                  />
                  {/* MC arrowhead */}
                  <polygon
                    points={`
                      ${mcPtStart.x},${mcPtStart.y}
                      ${mcPtStart.x + 4},${mcPtStart.y + 8}
                      ${mcPtStart.x - 4},${mcPtStart.y + 8}
                    `}
                    fill="#f43f5e"
                    transform={`rotate(${mcAngle + 90}, ${mcPtStart.x}, ${mcPtStart.y})`}
                  />
                  {/* MC text indicator */}
                  <text
                    x={mcPtStart.x}
                    y={mcPtStart.y - 12}
                    fill="#f43f5e"
                    fontSize="10px"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    MC
                  </text>
                </g>
              );
            })()}

            {/* PLANETS COORDINATES PLACEMENT */}
            {deconflictedPlanets.map((planet) => {
              const angle = getScreenAngle(planet.longitude);
              const pos = getCartesian(angle, planet.radius);

              const signNamesHi: Record<string, string> = {
                Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
              };

              const planetSignName = language === 'hi' ? (signNamesHi[planet.sign] || planet.sign) : planet.sign;

              return (
                <g key={planet.name} className="group/planet">
                  {/* Stalk connecting base to inner core frame */}
                  <line
                    x1={getCartesian(angle, 80).x}
                    y1={getCartesian(angle, 80).y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#6d1a08"
                    strokeWidth="0.5"
                    strokeOpacity="0.12"
                  />

                  {/* Hover visual target */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="10.5"
                    fill="#fffdf8"
                    stroke="#ff4b26"
                    strokeWidth="1.2"
                    className="cursor-pointer group-hover/planet:stroke-saffron-700 group-hover/planet:fill-saffron-50 transition-all duration-200"
                    onMouseEnter={() => handleElementHover(
                      'planet',
                      planet.name,
                      language === 'hi'
                        ? `अंश स्थिति: ${planet.degree}° ${planet.minute}' राशि ${planetSignName} ${planet.signSymbol} में। परिकलित भाव ${planet.house} में गतिशील रूप से स्थित।`
                        : `Fractions: ${planet.degree}° ${planet.minute}' in ${planet.sign} ${planet.signSymbol}. Placed dynamically in the calculated equal House ${planet.house}.`,
                      planet.longitude,
                      planet.house,
                      planet.sign,
                      `${planet.degree}° ${planet.minute}'`
                    )}
                  />

                  {/* Compact glyph indicator abbreviation */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    fill="#6d1a08"
                    fontSize="7px"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none font-sans"
                  >
                    {planet.name.substring(0, 2)}
                  </text>
                </g>
              );
            })}

            {/* Inner Core Shield Cover */}
            <circle cx="250" cy="250" r="79" fill="#fffdfa" opacity="0.95" />
            <circle cx="250" cy="250" r="78" fill="#fff9f5" />

            {/* Center Eye Astro Logo */}
            <g transform="translate(243, 243) scale(0.6)">
              <rect x="0" y="0" width="24" height="24" rx="12" fill="#6d1a08" />
              <path d="M12 2v20M2 12h20M12 12m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0" stroke="#f6e1c4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>

        <p className="text-[10px] text-slate-500 font-mono mt-3 text-center">
          {language === 'hi'
            ? '* बारीक विवरण देखने के लिए बाहरी चक्र, केंद्रीय दृष्टि रेखाओं, और ग्रह समूहों पर कर्सर ले जाएं या होवर करें।'
            : '* Drag cursor or hover over sectors of the outer wheel, core aspect rings, and planet clusters.'}
        </p>
      </div>

      {/* 2. LIVE INTERACTIVE TELEMETRY SCREEN */}
      {!hideTelemetry && (
        <div className="lg:col-span-5 h-[500px] flex flex-col justify-between bg-sand-50/90 border border-maroon-500/10 rounded-2xl p-5 shadow-xl relative">
        <div className="space-y-4 overflow-y-auto pr-1">
          
          <div className="flex items-center justify-between border-b border-maroon-500/10 pb-3">
            <h3 className="text-sm font-serif font-semibold text-maroon-700">
              {language === 'hi' ? 'टेलीमेट्री विश्लेषक' : 'Telemetry Analyst'}
            </h3>
            <span className="text-[9px] font-mono text-saffron-600 bg-saffron-50 border border-saffron-500/15 px-2 py-0.5 rounded">
              {language === 'hi' ? 'साइडरीयल समय स्थिर' : 'LST Locked'}
            </span>
          </div>

          {hoveredNode ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div id="hovered-avatar-box" className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg ${
                  hoveredNode.type === 'planet' ? getPlanetBg(hoveredNode.name) : 'bg-saffron-50 border-maroon-500/10 text-saffron-600'
                }`}>
                  {hoveredNode.type === 'planet' ? (
                    <span className="text-sm font-extrabold">{hoveredNode.name.substring(0, 2)}</span>
                  ) : hoveredNode.type === 'house' ? (
                    <span className="font-mono text-xs">H{hoveredNode.house}</span>
                  ) : hoveredNode.type === 'sign' ? (
                    <span>☯</span>
                  ) : (
                    <span>⚡</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-maroon-700 uppercase tracking-wider flex items-center gap-2">
                    {hoveredNode.name}
                    {hoveredNode.degreeText && (
                      <span className="text-xs font-mono font-normal text-saffron-600">
                        ({hoveredNode.degreeText})
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono capitalize">
                    {language === 'hi' ? 'सदिश नोड (Vector Node):' : 'Vector Node:'} {hoveredNode.type}
                  </p>
                </div>
              </div>

              {/* Informational bubble content */}
              <div className="p-3 bg-white border border-maroon-500/10 rounded-xl space-y-1.5 text-xs text-slate-700">
                <p className="leading-relaxed">{hoveredNode.details}</p>
                {hoveredNode.longitude !== undefined && (
                  <p className="text-[10px] font-mono text-slate-500">
                    {language === 'hi' ? 'सटीक क्रांतिवृत्त देशांतर:' : 'Exact Ecliptic Longitude:'} {hoveredNode.longitude.toFixed(4)}°
                  </p>
                )}
              </div>

              {/* Related metadata lookup info box based on type */}
              <div className="p-3 bg-saffron-50/50 border border-saffron-500/10 rounded-xl space-y-2 text-xs">
                {hoveredNode.type === 'planet' && (
                  <>
                    <h5 className="font-serif font-bold text-saffron-600 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" /> {language === 'hi' ? 'ग्रह की ऊर्जा' : 'Planetary Energy'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'hi'
                        ? `${hoveredNode.name} की स्थिति यह दर्शाती है कि आप अपने मूल व्यक्तित्व के इस विशिष्ट स्वरूप को कहां और कैसे प्रकट करते हैं। भाव ${hoveredNode.house} में इसकी स्थिति इन विषयों को लगातार सक्रिय करती है।`
                        : `The position of ${hoveredNode.name} shows where and how you express this specialized archetype of your core personality. Its placement in House ${hoveredNode.house} triggers these themes continuously.`}
                    </p>
                  </>
                )}

                {hoveredNode.type === 'house' && (
                  <>
                    <h5 className="font-serif font-bold text-saffron-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> {language === 'hi' ? 'जीवन अभिव्यक्ति का क्षेत्र' : 'Field of Life Expression'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'hi'
                        ? `भाव क्षेत्र सांसारिक क्षितिज को विभाजित करते हैं। भाव ${hoveredNode.house} आपके जीवन के व्यावहारिक क्षेत्र का प्रतिनिधित्व करता है जहां आप ${hoveredNode.sign || 'कर्क'} राशि के शासन में वास्तविक परिणाम प्राप्त करते हैं।`
                        : `House sectors divide the earthly horizon. House ${hoveredNode.house} represents your tangible life arena where you construct real results under the zodiac rule of ${hoveredNode.sign || 'Cancer'}.`}
                    </p>
                  </>
                )}

                {hoveredNode.type === 'sign' && (
                  <>
                    <h5 className="font-serif font-bold text-saffron-600 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> {language === 'hi' ? 'संवैधानिक गुण' : 'Constitutional Qualities'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'hi'
                        ? `राशियाँ ब्रह्मांडीय ऊर्जा के विशिष्ट स्वरूप या शैली को परिभाषित करती हैं। ${hoveredNode.name} का यह क्षेत्र इसके माध्यम से गोचर करने वाले सभी ग्रहों में प्रमुख ऊर्जावान आवृत्तियों का संचार करता है।`
                        : `Zodiac signs define the distinct *manner* or *flavour* of cosmic output. This specific sector of ${hoveredNode.name} infuses key energetic frequencies into any planets transiting through it.`}
                    </p>
                  </>
                )}

                {hoveredNode.type === 'aspect' && (
                  <>
                    <h5 className="font-serif font-bold text-saffron-600 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> {language === 'hi' ? 'कोणीय हार्मोनिक संश्लेषण' : 'Angular Harmonic Synthesis'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'hi'
                        ? `दृष्टि रेखाएं ग्रह केंद्रों के बीच गतिशील बातचीत को दर्शाती हैं। त्रिकोण/द्विद्वादश योग सुचारू रूप से चलते हैं, जबकि केन्द्र/प्रतियुति योग आध्यात्मिक विकास के लिए आवश्यक मजबूत सक्रिय संघर्ष प्रदान करते हैं।`
                        : `Aspect lines show dynamic conversations between planet centers. Trines/Sextiles flow smoothly, whereas Squares/Oppositions offer vital, active friction templates for spiritual expansion.`}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Compass className="w-8 h-8 text-saffron-500 animate-pulse" />
              <div>
                <p className="text-xs font-serif font-medium text-maroon-700">
                  {language === 'hi' ? 'टेलीमेट्री निष्क्रिय' : 'Telemetry Inactive'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  {language === 'hi'
                    ? 'इंटरैक्टिव जन्म कुंडली चक्र के भीतर किसी भी वस्तु पर होवर करें और उसके सटीक वास्तविक समय की गणना को यहाँ देखें।'
                    : 'Hover over any item inside the interactive birth chart wheel to view its exact real-time calculations here.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected primary coordinates overview */}
        <div className="pt-4 border-t border-maroon-500/10 space-y-2 text-xs">
          <div className="flex justify-between items-center bg-white px-3 py-2 rounded border border-maroon-500/5 font-mono text-[11px]">
            <span className="text-slate-500 font-sans">
              {language === 'hi' ? 'लग्न (ASC) संरेखण:' : 'ASC Vector:'}
            </span>
            <span className="font-semibold text-emerald-700">
              {chart.ascendant.signSymbol} {chart.ascendant.sign} ({chart.ascendant.degree}° {chart.ascendant.minute}')
            </span>
          </div>
          <div className="flex justify-between items-center bg-white px-3 py-2 rounded border border-maroon-500/5 font-mono text-[11px]">
            <span className="text-slate-500 font-sans">
              {language === 'hi' ? 'दशम भाव (MC) संरेखण:' : 'MC Vector:'}
            </span>
            <span className="font-semibold text-maroon-500">
              {chart.midheaven.signSymbol} {chart.midheaven.sign} ({chart.midheaven.degree}° {chart.midheaven.minute}')
            </span>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
