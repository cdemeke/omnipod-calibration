import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseWithGemini, getStoredApiKey, storeApiKey, clearApiKey } from '../../services/geminiParser';
import { createDemoCGMData } from '../../services/pdfParser';

export function UploadPage() {
  const { setCGMData, setActiveTab, state } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = getStoredApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      storeApiKey(apiKey.trim());
      setApiKeySaved(true);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setApiKey('');
    setApiKeySaved(false);
    setShowApiKeyInput(true);
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.includes('pdf')) {
        setError('Please upload a PDF file');
        return;
      }

      const currentApiKey = getStoredApiKey();
      if (!currentApiKey) {
        setError('Please enter your Gemini API key first');
        setShowApiKeyInput(true);
        return;
      }

      setIsProcessing(true);
      setError(null);
      setUploadSuccess(false);

      const result = await parseWithGemini(file, currentApiKey);

      setIsProcessing(false);

      if (result.success && result.data) {
        setCGMData(result.data);
        setUploadSuccess(true);
      } else {
        setError(result.error || 'Failed to parse PDF');
      }
    },
    [setCGMData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const loadDemoData = () => {
    const demoData = createDemoCGMData();
    setCGMData(demoData);
    setUploadSuccess(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Upload CGM Report</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a Dexcom Clarity 7-day PDF report. We'll use AI to analyze your blood sugar patterns.
        </p>
      </div>

      {/* API Key Section */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h3 className="text-sm font-medium text-blue-900">Gemini API Key</h3>
          </div>
          {apiKeySaved && !showApiKeyInput && (
            <button
              onClick={handleClearApiKey}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Change Key
            </button>
          )}
        </div>

        {showApiKeyInput ? (
          <div className="space-y-3">
            <p className="text-xs text-blue-700">
              We use Google's Gemini AI to accurately extract data from your Clarity reports.
              Your API key is stored locally in your browser.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                className="btn btn-primary text-sm"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-blue-600">
              Get a free API key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-800"
              >
                aistudio.google.com/apikey
              </a>
            </p>
          </div>
        ) : (
          <div className="flex items-center text-sm text-green-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            API key configured
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`
          card border-2 border-dashed transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          ${!apiKeySaved ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => apiKeySaved && document.getElementById('file-input')?.click()}
      >
        <div className="text-center py-12">
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600">Analyzing PDF with Gemini AI...</p>
              <p className="text-xs text-gray-400">This may take a few seconds</p>
            </div>
          ) : (
            <>
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">
                {apiKeySaved ? 'Drop your Dexcom Clarity PDF here' : 'Enter API key above first'}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInput}
              />
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Error processing PDF</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && state.cgmData && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">Report analyzed successfully!</h4>
                <p className="text-sm text-green-600 mt-1">
                  Time in Range: {state.cgmData.timeInRange.inRange}% |
                  Average: {state.cgmData.statistics.averageGlucose} mg/dL |
                  GMI: {state.cgmData.statistics.gmi}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('analysis')}
              className="btn btn-primary text-sm"
            >
              View Analysis
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">How to get your Dexcom Clarity report:</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Log in to <span className="font-medium">clarity.dexcom.com</span></li>
          <li>Select the 7-day date range for your report</li>
          <li>Click the print/export icon and save as PDF</li>
          <li>Upload the PDF here</li>
        </ol>
      </div>

      {/* Demo Data Button */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-500 mb-2">Don't have a PDF or API key? Try with sample data:</p>
        <button onClick={loadDemoData} className="btn btn-secondary">
          Load Demo Data
        </button>
      </div>

      {/* Recent Uploads */}
      {state.cgmHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Uploads</h3>
          <div className="space-y-2">
            {state.cgmHistory.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {new Date(report.uploadDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-500 ml-2">
                    TIR: {report.timeInRange.inRange}% | Avg: {report.statistics.averageGlucose} mg/dL
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCGMData(report);
                    setActiveTab('analysis');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
