"use client";

import React from "react";
import Toast from "@/shared/components/common/toast/toast";
import GlobalToast from "@/shared/components/common/toast/GlobalToast";
import { useToast } from "@/shared/hooks/useNotification";
import { useTheme } from "@/shared/contexts/ThemeContext";

export default function ToastDemoPage() {
  const { toast, showSuccess, showError, showInfo, showWarning, hideToast } = useToast();
  const { isDarkMode: darkMode, toggleDarkMode } = useTheme();

  const handleShowSuccess = () => {
    showSuccess("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
  };

  const handleShowError = () => {
    showError("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
  };

  const handleShowInfo = () => {
    showInfo("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
  };

  const handleShowWarning = () => {
    showWarning("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
  };

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Toast Notification Demo
          </h1>
          <button
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={handleShowSuccess}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Show Success Toast
          </button>
          
          <button
            onClick={handleShowError}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Show Error Toast
          </button>
          
          <button
            onClick={handleShowInfo}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Show Info Toast
          </button>
          
          <button
            onClick={handleShowWarning}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Show Warning Toast
          </button>
        </div>

        {/* Inline previews */}
        <div className="space-y-8">
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Inline Previews
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Success</h3>
              <Toast
                message="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                visible={true}
                type="success"
                onClose={() => {}}
                variant="inline"
                autoClose={false}
                darkMode={darkMode}
              />
            </div>
            
            <div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Error</h3>
              <Toast
                message="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                visible={true}
                type="error"
                onClose={() => {}}
                variant="inline"
                autoClose={false}
                darkMode={darkMode}
              />
            </div>
            
            <div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Informative</h3>
              <Toast
                message="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                visible={true}
                type="info"
                onClose={() => {}}
                variant="inline"
                autoClose={false}
                darkMode={darkMode}
              />
            </div>
            
            <div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Warning</h3>
              <Toast
                message="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                visible={true}
                type="warning"
                onClose={() => {}}
                variant="inline"
                autoClose={false}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active toast */}
      <GlobalToast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onClose={hideToast}
        position="bottom-left"
      />
    </div>
  );
} 