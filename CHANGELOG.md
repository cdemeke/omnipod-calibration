# Changelog

All notable changes to the Omnipod Calibration Assistant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-12-29

### Added
- **Initial release** of the Omnipod Calibration Assistant

#### Settings Management
- Basal rate editor with time-segmented scheduling
- Insulin-to-Carb Ratio (ICR) editor by time of day
- Insulin Sensitivity Factor (ISF) editor with correction target settings
- Goals editor for target ranges and Time in Range goals
- Automatic calculation of total daily basal

#### PDF Upload & Analysis
- Dexcom Clarity PDF upload with drag-and-drop support
- **Gemini AI integration** for accurate PDF data extraction
- Extracts Time in Range percentages (very low, low, in range, high, very high)
- Extracts glucose metrics (average, GMI, CV)
- Pattern recognition from AGP charts
- Demo data option for testing without API key

#### Analysis Dashboard
- Time in Range pie chart with goal comparison
- 24-hour glucose pattern chart (AGP-style visualization)
- Statistics summary cards (average glucose, GMI, CV, low events)
- Problem period identification with severity ranking
- Specific, actionable guidance for each problem area
- "Start Here" indicator for top priority issue

#### Recommendations Engine
- Single-focus recommendations (one change at a time)
- Safety-first approach (fixes lows before highs)
- Conservative adjustments (5-10% maximum changes)
- Priority ordering: lows → overnight → meal spikes → general highs
- Clear rationale explaining why each change is suggested
- Current vs. suggested value comparison
- Applied recommendations history tracking

#### User Experience
- Tab-based navigation (Settings, Upload, Analysis, Recommendations)
- Medical disclaimer prominently displayed
- All data stored locally in browser (localStorage)
- Responsive design with Tailwind CSS
- API key stored securely in browser

### Technical
- React 18 with TypeScript
- Vite build system
- Tailwind CSS for styling
- Recharts for data visualization
- Google Generative AI SDK for Gemini integration
- React Context for state management

---

## Future Roadmap

### Planned Features
- [ ] Export settings and history as JSON/PDF
- [ ] Multiple profile support (different users)
- [ ] Trend analysis across multiple uploads
- [ ] Integration with more CGM report formats (LibreView, Glooko)
- [ ] Dark mode support
- [ ] PWA support for offline access
- [ ] Automated pattern detection improvements

### Under Consideration
- Cloud sync option (opt-in)
- Healthcare provider sharing features
- A1C estimation trends
- Meal logging integration
