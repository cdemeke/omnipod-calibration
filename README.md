# Omnipod Calibration Assistant

A web application to help gradually adjust Omnipod insulin pump settings based on Dexcom Clarity CGM data. Designed to assist parents and caregivers in managing Type 1 diabetes by providing data-driven, incremental recommendations for pump setting adjustments.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Settings Management
- **Basal Rates**: Configure time-segmented background insulin delivery rates
- **Insulin-to-Carb Ratios (ICR)**: Set carb ratios for different times of day
- **Insulin Sensitivity Factor (ISF)**: Configure correction factors
- **Goals**: Set target blood glucose ranges and time-in-range goals

### PDF Upload & AI Analysis
- Upload Dexcom Clarity 7-day PDF reports
- **Gemini AI-powered parsing** for accurate data extraction
- Extracts Time in Range, average glucose, GMI, CV, and pattern observations

### Analysis Dashboard
- **Time in Range** pie chart visualization
- **24-hour glucose pattern** chart (AGP-style)
- **Statistics summary** (average, GMI, variability, low events)
- **Problem period identification** with specific, actionable guidance

### Smart Recommendations
- **One change at a time** - focused suggestions for gradual improvement
- **Safety-first approach** - always prioritizes fixing lows before highs
- **Conservative adjustments** - maximum 5-10% changes per recommendation
- **Clear rationale** - explains why each change is suggested
- **Current settings context** - shows your current value alongside the suggestion

### Privacy-First Design
- **All data stored locally** in your browser's localStorage
- No backend server required
- Your Gemini API key stays on your device

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Google Gemini API key (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cdemeke/omnipod-calibration.git
cd omnipod-calibration
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into the app's Upload page

## Usage

### 1. Enter Your Current Settings
Navigate to the **Settings** tab and enter your current Omnipod settings:
- Basal rates for each time segment
- Insulin-to-carb ratios
- Correction factors
- Target glucose range and goals

### 2. Upload a Clarity Report
Go to the **Upload** tab:
- Enter your Gemini API key (first time only)
- Upload a Dexcom Clarity 7-day PDF report
- The AI will extract all relevant data automatically

### 3. Review Your Analysis
The **Analysis** tab shows:
- Your Time in Range breakdown
- 24-hour glucose patterns
- Key statistics
- Problem periods with specific guidance

### 4. Get Recommendations
The **Recommendations** tab provides:
- One focused suggestion at a time
- Clear explanation of what to change and why
- Your current setting vs. the suggested value
- Option to apply or skip each recommendation

### 5. Iterate
After making a change:
1. Update your Omnipod with the new setting
2. Wait 3-5 days to see the effect
3. Upload a new Clarity report
4. Get your next recommendation

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **PDF Analysis**: Google Gemini 2.0 Flash
- **State Management**: React Context + useReducer
- **Storage**: Browser localStorage

## Project Structure

```
src/
├── components/
│   ├── analysis/        # Analysis dashboard components
│   ├── common/          # Header, navigation
│   ├── recommendations/ # Recommendation cards and history
│   ├── settings/        # Pump settings editors
│   └── upload/          # PDF upload interface
├── context/             # React Context for app state
├── services/
│   ├── geminiParser.ts  # Gemini AI PDF parsing
│   ├── pdfParser.ts     # Fallback PDF parsing
│   └── recommender.ts   # Recommendation engine
└── types/               # TypeScript interfaces
```

## Safety Disclaimer

**Important**: This tool is for informational purposes only and does not replace medical advice. Always consult with your healthcare provider before making changes to insulin pump settings.

The application includes several safety features:
- Maximum adjustment recommendations of 5-10%
- Prioritizes fixing hypoglycemia before hyperglycemia
- Recommends waiting 3-5 days between changes
- Clear warnings for patterns requiring medical attention

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- AGP visualization inspired by [International Diabetes Center](https://www.idcdiabetes.org/)
- Time in Range goals based on [ADA Standards of Care](https://diabetesjournals.org/care)
