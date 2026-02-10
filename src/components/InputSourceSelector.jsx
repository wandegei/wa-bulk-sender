import React from 'react';
import { Upload, FileText, FileSpreadsheet, Users } from 'lucide-react';

const INPUT_SOURCES = [
  {
    id: 'paste',
    label: 'Paste Numbers',
    icon: FileText,
    description: 'Paste phone numbers (one per line)'
  },
  {
    id: 'csv',
    label: 'CSV Upload',
    icon: Upload,
    description: 'Upload CSV file with contacts'
  },
  {
    id: 'excel',
    label: 'Excel Upload',
    icon: FileSpreadsheet,
    description: 'Upload Excel file (.xlsx, .xls)'
  },
  {
    id: 'saved',
    label: 'Saved Contacts',
    icon: Users,
    description: 'Load previously saved contacts'
  }
];

function InputSourceSelector({ selectedSource, onSelectSource }) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Source</h2>
      
      {INPUT_SOURCES.map(source => {
        const Icon = source.icon;
        const isActive = selectedSource === source.id;
        
        return (
          <button
            key={source.id}
            onClick={() => onSelectSource(source.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              isActive
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={`w-5 h-5 mt-0.5 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium ${
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {source.label}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {source.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default InputSourceSelector;