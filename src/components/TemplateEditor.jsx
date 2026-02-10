import React, { useState, useEffect } from 'react';
import { Save, Download, Trash2, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../components/ui/use-toast';
import {
  extractPlaceholders,
  validatePlaceholders,
  getAvailableFields,
  countTemplateCharacters
} from '../utils/templateUtils';

function TemplateEditor({ contacts, template, onTemplateChange, onPreview }) {
  const [localTemplate, setLocalTemplate] = useState(template);
  const [validation, setValidation] = useState({ valid: true, missingFields: [] });
  const [availableFields, setAvailableFields] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      const fields = getAvailableFields(contacts);
      setAvailableFields(fields);
    }
  }, [contacts]);

  useEffect(() => {
    setLocalTemplate(template);
  }, [template]);

  useEffect(() => {
    loadSavedTemplates();
  }, []);

  const loadSavedTemplates = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('bulkWhatsApp_templates') || '[]');
      setSavedTemplates(saved);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateChange = (e) => {
    const newTemplate = e.target.value;
    setLocalTemplate(newTemplate);
    onTemplateChange(newTemplate);

    // Validate placeholders immediately
    if (availableFields.length > 0) {
      const result = validatePlaceholders(newTemplate, availableFields);
      setValidation(result);
    }
  };

  const handleSaveTemplate = () => {
    if (!localTemplate.trim()) {
      toast({
        title: 'Empty Template',
        description: 'Please enter a template before saving',
        variant: 'destructive',
      });
      return;
    }

    const name = prompt('Enter a name for this template:');
    if (!name) return;

    try {
      const saved = [...savedTemplates, {
        name,
        template: localTemplate,
        timestamp: new Date().toISOString()
      }];
      
      localStorage.setItem('bulkWhatsApp_templates', JSON.stringify(saved));
      setSavedTemplates(saved);
      
      toast({
        title: 'Template Saved',
        description: `Template "${name}" has been saved`,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLoadTemplate = (template) => {
    setLocalTemplate(template.template);
    onTemplateChange(template.template);
    setShowSaved(false);
    
    // Validate loaded template
    if (availableFields.length > 0) {
      const result = validatePlaceholders(template.template, availableFields);
      setValidation(result);
    }
    
    toast({
      title: 'Template Loaded',
      description: `Loaded "${template.name}"`,
    });
  };

  const handleDeleteTemplate = (index) => {
    try {
      const updated = savedTemplates.filter((_, i) => i !== index);
      localStorage.setItem('bulkWhatsApp_templates', JSON.stringify(updated));
      setSavedTemplates(updated);
      
      toast({
        title: 'Template Deleted',
        description: 'Template has been removed',
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleClearTemplate = () => {
    setLocalTemplate('');
    onTemplateChange('');
    setValidation({ valid: true, missingFields: [] });
  };

  const insertPlaceholder = (field) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localTemplate;
    const newText = text.substring(0, start) + `{${field}}` + text.substring(end);
    
    setLocalTemplate(newText);
    onTemplateChange(newText);
    
    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + field.length + 2, start + field.length + 2);
    }, 0);
  };

  const charCount = countTemplateCharacters(localTemplate);
  const placeholders = extractPlaceholders(localTemplate);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message Template
          </label>
          <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {charCount} characters
          </div>
        </div>
        
        <textarea
          value={localTemplate}
          onChange={handleTemplateChange}
          placeholder="Hi {first_name}, check out our new offers!..."
          className={`w-full h-48 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none font-sans ${
            !validation.valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        />

        {!validation.valid && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Missing Fields Detected</p>
              <p className="text-sm text-red-700 mt-1">
                The following placeholders are not in your contact list:{' '}
                {validation.missingFields.map(f => (
                  <span key={f} className="font-mono bg-red-100 px-1 rounded mx-0.5">{`{${f}}`}</span>
                ))}
              </p>
            </div>
          </div>
        )}

        {availableFields.length > 0 && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Insert Variables:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableFields.map(field => (
                    <button
                      key={field}
                      onClick={() => insertPlaceholder(field)}
                      className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-800 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      {`{${field}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        <Button onClick={handleSaveTemplate} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button
          onClick={() => setShowSaved(!showSaved)}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Load ({savedTemplates.length})
        </Button>

        <Button onClick={handleClearTemplate} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>

        <Button
          onClick={onPreview}
          disabled={!localTemplate.trim()}
          className="ml-auto"
        >
          Preview & Continue
        </Button>
      </div>

      {showSaved && savedTemplates.length > 0 && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3 animate-in fade-in">
          <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Saved Templates</h3>
          {savedTemplates.map((tmpl, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start justify-between gap-3 group hover:bg-white hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{tmpl.name}</p>
                <p className="text-sm text-gray-600 truncate mt-1 font-mono bg-gray-100 p-1 rounded">
                  {tmpl.template.substring(0, 100)}...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(tmpl.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => handleLoadTemplate(tmpl)}
                  size="sm"
                  className="h-8"
                >
                  Load
                </Button>
                <Button
                  onClick={() => handleDeleteTemplate(index)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateEditor;