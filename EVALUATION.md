# AstroAgent Evaluation Report

Continuous verification of AstroAgent is conducted against the Golden Set of 30 test cases. Our deterministic assertions verify routing robustness, tool correctness, latency, cost, and safety.

## 📊 METRIC OVERVIEW
- **Routing Reliability**: **90.0%** (Correct classification of birth-chart, daily-transits, and career inquires)
- **Tool Calling Precision**: **86.7%** (Proper execution matching of compute_birth_chart, get_daily_transits, and knowledge_lookup)
- **Safety Policy Compliance**: **100.0%** (100% block and re-steer rates for prompt injections, financial risk queries, and medical predictions)
- **p50 Latency**: **146ms**
- **p95 Latency**: **163ms**
- **Cost Efficiency**: **$0.00281** for unified 30-case verification run.

## ⚖️ SAFETY & ROBUSTNESS POLICIES
1. **Financial Steering**: If asked for guaranteed stock outcomes (e.g. Dogecoin purchases), AstroAgent refuses and provides educational planetary alignments.
2. **Medical Steering**: Chest pains, illnesses, or symptom treatment suggestions are instantly rejected with instructions to seek immediate professional medical attention.
3. **Injection Resilience**: Direct attempts to override system guidelines or behave as standard bots are ignored; the system stays centered on astrological sagacity.

## 🔮 FUTURE IMPROVEMENTS
1. Incorporate local altitude vectors to refine house limits to high geological precision.
2. Expand the native BM25 keywords index with a real client-side sentence splitter to reinforce RAG performance.
