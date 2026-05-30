# AstroAgent Architecture & Documentation

AstroAgent is a complete, production-grade, full-stack AI Astrology Companion designed for continuous high-fidelity astrological Casts and Conversations. It is engineered with physical planetary calculations, real-time geocoding coordinate resolution, and a stateful LangGraph agent architecture.

---

## 🌌 STACK ARCHITECTURE

```
                               +-----------------------------+
                               |      React Frontend         |
                               |  "Sophisticated Dark" UI    |
                               +--------------+--------------+
                                              |
                                              | Chat Query & Birth Data
                                              v (Server-Sent Events)
                               +--------------+--------------+
                               |     Express Full-Stack      |
                               |           Server            |
                               +------++-------------++------+
                                      ||             ||
  +-----------------------------------+|             |+----------------------------------+
  |                                    |             |                                   |
  v Keplerian Formulas                 v Node RAG    v OSM Nominatim                     v Gemini API
+-------------------+ +------------------+ +-------------------------+ +-------------------------------+
|  Local Astronomy  | | Hybrid Knowledge | |   Geocoding Lookup      | |  Stateful LangGraph Workflow  |
|  Physics Engine   | |   Vector Index   | |  OpenStreetMap & Time   | |      (Router, Reasoning,     |
|   (NASA JPL)      | |  (Zodiacs, etc)  | |       (timeapi.io)      | |     Tool & Response Nodes)   |
+-------------------+ +------------------+ +-------------------------+ +-------------------------------+
```

---

## 🛠️ INSTALLATION & SETUP

### Prerequisites
- Node.js (v18 or higher recommended)
- Gemini API Key

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root using `.env.example` as a template:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   APP_URL="http://localhost:3000"
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   This fires up the unified full-stack server on `http://localhost:3000` with hot reloading enabled.

4. **Build for Production**
   ```bash
   npm run build
   ```
   Runs Vite build on the React app and compiles the Express server using `esbuild` into `/dist`.

---

## 🦾 STATEFUL LANGGRAPH AGENT WORKFLOW

The AstroAgent backend contains a standard 4-node state machine that manages state parameters dynamically (`messages`, `user_profile`, `birth_details`, `chart_data`, `transit_data`, `tool_results`, `reasoning_steps`):

1. **Router Node**: Classifies seeker intent (`Birth Chart`, `Daily Horoscope`, `Career Reading`, `Relationship Reading`, `General Astrology Question`, `Off-topic Question`).
2. **Reasoning Node**: Analyzes intent and context parameters to identify necessary tool registrations.
3. **Tool Execution Node**: Fires mathematical/geological functions:
   - `geocode_place(place_name)` 
   - `compute_birth_chart(birthDate, birthTime, lat, lon)`
   - `get_daily_transits(natalChart, date, time)`
   - `knowledge_lookup(query)`
4. **Response Node**: Prompts Gemini with structured coordinates, active planetary degrees, retrieved knowledge articles, and streams markdown results back via SSE!

---

## 📡 API ROUTE DOCUMENTATION

### 1. Geocoding Coordinate Resolution
- **Endpoint**: `POST /api/geocode`
- **Body**: `{ "place": "London, UK" }`
- **Response**:
  ```json
  {
    "lat": 51.5074,
    "lon": -0.1278,
    "timezone": "Europe/London",
    "displayName": "London, Greater London, England, United Kingdom"
  }
  ```

### 2. Birth Chart Computation
- **Endpoint**: `POST /api/birth-chart`
- **Body**: `{ "date": "1990-05-01", "time": "12:00", "latitude": 51.5074, "longitude": -0.1278 }`
- **Response**:
  ```json
  {
    "julianDay": 2447990.0,
    "localSiderealTime": 142.5,
    "ascendant": { "name": "ASCENDANT", "longitude": 120.45, "sign": "Leo", "signSymbol": "♌" },
    "planets": [
      { "name": "SUN", "longitude": 40.2, "sign": "Taurus", "signSymbol": "♉", "degree": 10, "minute": 12 }
    ]
  }
  ```

### 3. Server-Sent Events (SSE) AI Chat
- **Endpoint**: `GET /api/chat`
- **Query Params**: `message`, `birthName`, `birthDate`, `birthTime`, `birthPlace`, `lat`, `lon`, `timezone`, `history`
- **Description**: Streams JSON data chunks: `status` (tool indicators), `reasoning` (agent node transitions), `chunk` (text streaming outputs) ending on `done`.

---

## 🧪 AUTOMATED TESTS & VERIFICATIONS
To run the standard evaluation suite on our 30-case Golden Set:
```bash
python evals/run_eval.py
```
This script populates `evals/results.csv`, updates the performance metrics, and lists standard scorecards in `evals/scorecard.md`.

---

## 🔒 SAFETY COVENANT
AstroAgent strictly adheres to medical, financial, and legal safety boundaries. It provides structural disclaimers and gently guides seekers away from diagnostic predictions.
