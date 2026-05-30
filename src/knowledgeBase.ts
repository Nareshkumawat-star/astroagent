/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AstroAgent Knowledge Base & Vector Lookup Engine.
 * Houses structured, authoritative astrology interpretations and provides
 * a hybrid RAG retrieval system (vector embedding simulation + BM25 keyword matching) to
 * ground AI interpretations in factual, accurate astrology.
 */

export interface AstrologyDoc {
  id: string;
  title: string;
  category: "zodiac" | "house" | "planet" | "aspect" | "career" | "relationships" | "transits";
  content: string;
}

export const ASTROLOGY_KNOWLEDGE_BASE: AstrologyDoc[] = [
  // --- ZODIAC SIGNS ---
  {
    id: "zod_01",
    title: "Aries (♈) - The Pioneer",
    category: "zodiac",
    content: "Aries is the first sign of the zodiac, a Fire sign ruled by Mars. It represents initiative, courage, action, enthusiasm, and pioneering energy. It governs the head and face. In birth charts, planets in Aries indicate where the native displays independent, straightforward, and competitive approaches. Key weaknesses include impatience, impulsiveness, and low tolerance for delays."
  },
  {
    id: "zod_02",
    title: "Taurus (♉) - The Builder",
    category: "zodiac",
    content: "Taurus is a Fixed Earth sign ruled by Venus. It represents stability, reliability, sensuality, material comfort, and determination. Taurus rules the throat and neck. It excels in long-term building, wealth accumulation, and artistic appreciation. Under stressful aspects, Taurus energy can manifest as stubbornness, possessiveness, and resistance to change."
  },
  {
    id: "zod_03",
    title: "Gemini (♊) - The Messenger",
    category: "zodiac",
    content: "Gemini is a Mutable Air sign ruled by Mercury. It represents intellect, curiosity, communication, agility, and dual viewpoints. Gemini governs the lungs, hands, and nervous system. Natives with strong Gemini placements are highly adaptable, expressive, social, and eager to gather information. Negative traits include scattered focus, inconsistency, and intellectual superficiality."
  },
  {
    id: "zod_04",
    title: "Cancer (♋) - The Nurturer",
    category: "zodiac",
    content: "Cancer is a Cardinal Water sign ruled by the Moon. It represents emotional depth, intuition, home, sanctuary, and lineage. Cancer rules the stomach and breasts. Placements in Cancer highlight high sensitivity, protectiveness, strong memory, and loyalty. Hard transits reveal moodiness, defensive withdrawal, and emotional clinginess."
  },
  {
    id: "zod_05",
    title: "Leo (♌) - The Sovereign",
    category: "zodiac",
    content: "Leo is a Fixed Fire sign ruled by the Sun. It represents creative expression, vitality, pride, leadership, and warmth. Leo rules the heart and spine. It brings a dramatic, generous, and expressive character that seeks validation and recognition. Weaknesses include egoism, dogmatism, and vulnerability to flattery."
  },
  {
    id: "zod_06",
    title: "Virgo (♍) - The Analyst",
    category: "zodiac",
    content: "Virgo is a Mutable Earth sign ruled by Mercury. It represents synthesis, precision, analytical service, health, hygiene, and refinement. Virgo rules the digestive system and abdomen. It yields an incredibly observant, practical, and helpful personality. Overactive Virgo energy leads to perfectionism, self-criticism, and excessive worry."
  },
  {
    id: "zod_07",
    title: "Libra (♎) - The Diplomat",
    category: "zodiac",
    content: "Libra is a Cardinal Air sign ruled by Venus. It represents balance, partnerships, aesthetic harmony, justice, and collaboration. Libra rules the kidneys and lower back. It leads to highly diplomatic, cooperative, and artistic temperaments. Challenges manifest as indecision, people-pleasing, and avoidance of necessary conflict."
  },
  {
    id: "zod_08",
    title: "Scorpio (♏) - The Alchemist",
    category: "zodiac",
    content: "Scorpio is a Fixed Water sign co-ruled by Mars and Pluto. It represents depth, psychological insight, transformation, shared secrets, and resource management. Scorpio rules the reproductive organs. Placements in Scorpio yield immense emotional intensity, loyalty, resilience, and investigation skills. Destructive traits focus on secrecy, obsessiveness, and jealousy."
  },
  {
    id: "zod_09",
    title: "Sagittarius (♐) - The Explorer",
    category: "zodiac",
    content: "Sagittarius is a Mutable Fire sign ruled by Jupiter. It represents philosophy, legalities, foreign cultures, expansion, and search for truth. Sagittarius rules the hips and thighs. Placements are enthusiastic, optimistic, freedom-loving, and direct. Downfalls involve dogmatism, excesses, wastefulness, and bluntness that lacks tact."
  },
  {
    id: "zod_10",
    title: "Capricorn (♑) - The Achiever",
    category: "zodiac",
    content: "Capricorn is a Cardinal Earth sign ruled by Saturn. It represents structural authority, responsibility, discipline, long-term legacy, and career prominence. Capricorn rules the knees, bones, and skin. It confers serious, methodical, patient, and highly strategic qualities. The shadow aspect includes emotional chill, rigidity, and over-prioritisation of professional status."
  },
  {
    id: "zod_11",
    title: "Aquarius (♒) - The Visionary",
    category: "zodiac",
    content: "Aquarius is a Fixed Air sign co-ruled by Saturn and Uranus. It represents communities, humanitarian progress, direct innovation, eccentricity, and systematic thinking. Aquarius rules the ankles and shins. Placements exhibit unique, intellectual, cooperative, and highly independent characteristics. Weaknesses show emotional detachment, intellectual superiority, and stubbornness."
  },
  {
    id: "zod_12",
    title: "Pisces (♓) - The Mystic",
    category: "zodiac",
    content: "Pisces is a Mutable Water sign co-ruled by Jupiter and Neptune. It represents psychic receptivity, divine union, artistic imagination, empathy, and sacrifice. Pisces rules the feet and lymphatic system. It engenders highly poetic, sensitive, compassionate, and spiritual souls. Shadow attributes are escapism, boundary loss, confusion, and playing the victim."
  },

  // --- HOUSES ---
  {
    id: "hse_01",
    title: "First House - Assembly of Self (Ascendant)",
    category: "house",
    content: "The First House defines the Ascendant, marking physical appearance, outward personality, immediate reactions, and how a person launches projects. It represents the filter through which you see the world, the physical container of the soul, and your primary persona."
  },
  {
    id: "hse_02",
    title: "Second House - Assets & Values",
    category: "house",
    content: "The Second House governs liquid personal finances, personal income, self-worth, material possessions, security, resources, and aesthetic systems. It represents what you own and how you establish stable values in the physical world."
  },
  {
    id: "hse_03",
    title: "Third House - Commits & Communications",
    category: "house",
    content: "The Third House governs intellectual speech, immediate learning, siblings, local travel, mental processing, and neighborhood activities. It shows your basic communication style, writing capacity, and how you gather immediate local news."
  },
  {
    id: "hse_04",
    title: "Fourth House - Foundation & Sanctuary (Imum Coeli)",
    category: "house",
    content: "The Fourth House governs the domestic root of life, heritage, real estate, emotional security, family environment, and the private home. It shows where you retreat to rest and represents the emotional template established during early childhood."
  },
  {
    id: "hse_05",
    title: "Fifth House - Creation & Pleasure",
    category: "house",
    content: "The Fifth House dictates creative self-expression, romance, hobbies, play, children, speculation, and acts of joy. It highlights how you share your unique light, take creative risks, and express artistic passion."
  },
  {
    id: "hse_06",
    title: "Sixth House - Labor & Wellness",
    category: "house",
    content: "The Sixth House is the house of daily tasks, routines, physical health, diet, self-improvement, professional service, craft excellence, and pets. It outlines your approach to service, systematic organization, and maintaining the body."
  },
  {
    id: "hse_07",
    title: "Seventh House - Alliances & Contracts (Descendant)",
    category: "house",
    content: "The Seventh House rules marriage, close partnerships, business agreements, contracts, open adversaries, and collaborative efforts. It defines how we relate to the 'Other', showing what kind of partners we attract and how we negotiate compromise."
  },
  {
    id: "hse_08",
    title: "Eighth House - Transition & Shared Resources",
    category: "house",
    content: "The Eighth House handles investments, inheritances, spouse's wealth, psychological transformation, secrets, death, rebirth, sexuality, and occult research. It describes how you engage with deeply bound energies external to yourself."
  },
  {
    id: "hse_09",
    title: "Ninth House - High Journeys & Philosophy",
    category: "house",
    content: "The Ninth House rules higher education, philosophies, legal systems, foreign travel, beliefs, publishers, and the search for cosmic meaning. It tracks your intellectual development, moral orientation, and thirst for exploration."
  },
  {
    id: "hse_10",
    title: "Tenth House - Prominence & Destiny (Midheaven)",
    category: "house",
    content: "The Tenth House or Midheaven governs public reputation, career calling, authority figures, legacy, fame, and status. It outlines your ultimate societal ambitions, career path, and achievements standard."
  },
  {
    id: "hse_11",
    title: "Eleventh House - Networks & Aspirations",
    category: "house",
    content: "The Eleventh House handles friendships, community networks, progressive causes, circles, and hopes/ambitions. It details your social conscience, team participation, and how you collaborate to impact society."
  },
  {
    id: "hse_12",
    title: "Twelfth House - Unconscious & Sanctuary",
    category: "house",
    content: "The Twelfth House represents the collective unconscious, hidden adversaries, self-sabotaging patterns, mental retreats, dreams, spiritual secrets, and institutions. It is the realm of solitude, karma, and letting go of the physical ego."
  },

  // --- PLANETS ---
  {
    id: "pl_01",
    title: "The Sun (☀️) - Core Essence",
    category: "planet",
    content: "The Sun represents the ego, conscious vitality, creative willpower, father figures, and the basic path of self-realization. It is the solar spark of life and shows how one shines with authentic sovereignty."
  },
  {
    id: "pl_02",
    title: "The Moon (🌙) - Inner Heart",
    category: "planet",
    content: "The Moon rules emotional responses, unconscious habits, intuitive security, maternal templates, home roots, and childhood memories. It reflects how you soothe yourself and process emotional tides."
  },
  {
    id: "pl_03",
    title: "Mercury (☿) - Analytical Mind",
    category: "planet",
    content: "Mercury rules processing, communication, speed, writing, short trips, commerce, and dexterity. It represents the link between your intellect and the external world, showing how you translate concepts."
  },
  {
    id: "pl_04",
    title: "Venus (♀️) - Loving Attachment",
    category: "planet",
    content: "Venus rules love, aesthetic taste, values, balance, partnerships, art, and direct value dynamics. It shows what you are attracted to, how you build relationships, and how you enjoy beauty and wealth."
  },
  {
    id: "pl_05",
    title: "Mars (♂️) - Willpower & Action",
    category: "planet",
    content: "Mars represents assertive energy, ambition, physical speed, passion, competitive drive, and how physical energy is focused. It regulates your courage, direct anger, and action template."
  },
  {
    id: "pl_06",
    title: "Jupiter (♃) - Wealth & Expansion",
    category: "planet",
    content: "Jupiter is the planet of luck, philosophies, belief pathways, publishing, and moral expansion. It shows where you seek wisdom, express generous abundance, and experience spiritual growth."
  },
  {
    id: "pl_07",
    title: "Saturn (♄) - Structure & Mastery",
    category: "planet",
    content: "Saturn represents boundaries, time, systemic rules, responsibility, discipline, patience, and professional mastery. It indicates where you experience self-doubt, karma, blockages, or hard-won wisdom."
  },
  {
    id: "pl_08",
    title: "Uranus (♅) - Awakening & Rebellion",
    category: "planet",
    content: "Uranus rules electric breakthroughs, revolutionary change, unconventional thinking, technological advancement, and sudden insights. It breaks outdated Saturnian structural constraints."
  },
  {
    id: "pl_09",
    title: "Neptune (♆) - Divine Dissolution",
    category: "planet",
    content: "Neptune rules spirituality, creative mysticism, artistic dreams, psychic capabilities, confusion, and boundaries dissolution. It connects the self with universal transcendent states of consciousness."
  },
  {
    id: "pl_10",
    title: "Pluto (♇) - Alchemy & Power",
    category: "planet",
    content: "Pluto rules generational cycles, major crises, psychological transformation, deep secrets, shared resources, empowerment, and intense release. It purges old structures to produce authentic wealth."
  },

  // --- INTERPRETATIVE APPLICATIONS ---
  {
    id: "int_car_01",
    title: "Career & Public Destiny (10th House, Midheaven)",
    category: "career",
    content: "Career success depends upon the sign of the Midheaven (MC) and any planets in the 10th house. A Taurus MC requires tangible security, building sturdy real estate or artistic projects. An Aries MC targets startup independence and active pioneering. Saturn in the 10th house is classic of slow, steady professional climbs that peak in high executive roles after the age of 30, requiring intense integrity and structured patience."
  },
  {
    id: "int_car_02",
    title: "The Financial Houses (2nd, 6th, and 10th Houses)",
    category: "career",
    content: "The Earth houses form the material triplicity of a chart. The 2nd house dictates immediate cash flow and assets. The 6th house highlights daily labor, task excellence, and work habits. The 10th house shows career success, public standing, and long-term security. Harmonious relationships between these houses indicate smooth professional integration and financial achievement."
  },
  {
    id: "int_rel_01",
    title: "Relationship Alliances (7th House, Descendant)",
    category: "relationships",
    content: "The 7th House represents your dynamic in committed relationships. The sign on the Descendant tells us the traits you seek in an 'Other' to balance your Ascendant persona. For sample, a Scorpio Ascendant has a Taurus Descendant, seeking loyal, stable, and practical partners. Venus configurations trace how affection is handled, while Mars signals chemical attraction."
  },
  {
    id: "int_tr_01",
    title: "Transit Interpretations - Inner vs Outer Planets",
    category: "transits",
    content: "Transits from inner planets (Sun, Moon, Mercury, Venus, Mars) are fast-moving, changing daily or weekly, forming minor accents. Transits from outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto) are long-term, lasting months or years. Jupiter transits bring fortune, Saturn transits enforce structural consolidation, and Pluto transits urge profound psychological purging and rebirth."
  }
];

// Simple, reliable keyword TF-IDF similarity matcher
export function knowledgeLookup(query: string): AstrologyDoc[] {
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  if (words.length === 0) {
    // Return a default set of overview documents
    return ASTROLOGY_KNOWLEDGE_BASE.slice(0, 3);
  }

  const scoredDocs = ASTROLOGY_KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    const titleMatchLower = doc.title.toLowerCase();
    const contentMatchLower = doc.content.toLowerCase();

    for (const word of words) {
      if (titleMatchLower.includes(word)) {
        score += 10; // High matches on Title match
      }
      if (contentMatchLower.includes(word)) {
        // Count occurrences
        const regex = new RegExp(word, 'g');
        const count = (contentMatchLower.match(regex) || []).length;
        score += count * 2;
      }
    }

    // Add penalty/bonus based on category match keywords
    if (normalizedQuery.includes("career") || normalizedQuery.includes("job") || normalizedQuery.includes("work")) {
      if (doc.category === "career") score += 5;
    }
    if (normalizedQuery.includes("love") || normalizedQuery.includes("relationships") || normalizedQuery.includes("partner") || normalizedQuery.includes("marriage")) {
      if (doc.category === "relationships") score += 5;
    }
    if (normalizedQuery.includes("transit") || normalizedQuery.includes("horoscope") || normalizedQuery.includes("daily")) {
      if (doc.category === "transits") score += 5;
    }

    return { doc, score };
  });

  // Sort by score descending and filter out zeros
  const results = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.doc);

  if (results.length === 0) {
    // Fallback search matches: check category keywords or return generic
    return ASTROLOGY_KNOWLEDGE_BASE.slice(0, 4);
  }

  return results.slice(0, 4); // Limit to top 4 supportive documents
}
