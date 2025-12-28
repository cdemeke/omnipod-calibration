export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Omnipod Calibration Assistant
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gradual adjustments for better blood sugar management
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Data stored locally
            </span>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-amber-50 border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-xs text-amber-800">
            <strong>Important:</strong> This tool is for informational purposes only and does not replace medical advice.
            Always consult with your healthcare provider before making changes to insulin pump settings.
          </p>
        </div>
      </div>
    </header>
  );
}
