import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Users, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { extractPhonesFromText } from '../utils/phoneUtils';
import { parseCSV, parseExcel, detectHeaders } from '../utils/fileParser';
import { mergeContactData, loadContactsFromStorage, deleteContactList } from '../utils/contactUtils';

function InputForm({ inputSource, onContactsLoaded }) {
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null); // { data: [], headers: [] }
  const [headerMapping, setHeaderMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [savedLists, setSavedLists] = useState([]);
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Standard field types for mapping
  const FIELD_TYPES = [
    { value: 'phone', label: 'Phone Number (Required)' },
    { value: 'name', label: 'Full Name' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email Address' },
    { value: 'location', label: 'Location' }
  ];

  // Load saved contacts when switching to saved source
  React.useEffect(() => {
    if (inputSource === 'saved') {
      setSavedLists(loadContactsFromStorage());
    }
  }, [inputSource]);

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setUploadedFile(file);

    try {
      let result;

      if (inputSource === 'csv') {
        const text = await file.text();
        result = parseCSV(text);
      } else if (inputSource === 'excel') {
        result = await parseExcel(file);
      }

      if (result.error) {
        toast({
          title: 'Parsing Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      setParsedData(result);

      // Auto-detect header mapping using original headers
      // result.headers contains original string headers from file
      const detected = detectHeaders(result.headers);
      setHeaderMapping(detected);

      toast({
        title: 'File Uploaded',
        description: `Successfully parsed ${result.data.length} rows with ${result.headers.length} columns`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const isValid = inputSource === 'csv' 
        ? file.type === 'text/csv' || file.name.endsWith('.csv')
        : file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (!isValid) {
        toast({
          title: 'Invalid File Type',
          description: `Please upload a valid ${inputSource.toUpperCase()} file`,
          variant: 'destructive',
        });
        return;
      }

      handleFileSelect(file);
    }
  };

  const handleHeaderMappingChange = (csvHeader, fieldType) => {
    setHeaderMapping(prev => ({
      ...prev,
      [fieldType]: csvHeader
    }));
  };

  const handleConfirm = () => {
    setIsLoading(true);
    
    try {
      if (inputSource === 'paste') {
        // Extract phones from text
        const phones = extractPhonesFromText(textInput);
        
        if (phones.length === 0) {
          toast({
            title: 'No Valid Numbers',
            description: 'Please enter valid phone numbers',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Use helper to create basic contact structure
        const contacts = mergeContactData(phones, [], {});
        onContactsLoaded(contacts);
        
      } else if ((inputSource === 'csv' || inputSource === 'excel') && parsedData) {
        // Check if phone is mapped
        if (!headerMapping.phone) {
          toast({
            title: 'Missing Mapping',
            description: 'Please map the "Phone Number" column to proceed',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Merge using header mapping
        const contacts = mergeContactData(
          [], // No raw phones
          parsedData.data, 
          headerMapping
        );

        if (contacts.length === 0) {
          toast({
            title: 'No Valid Contacts',
            description: 'Could not extract valid phone numbers based on your mapping',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        onContactsLoaded(contacts);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSavedList = (list) => {
    onContactsLoaded(list.contacts);
    toast({
      title: 'Contacts Loaded',
      description: `${list.contacts.length} contacts loaded from "${list.name}"`,
    });
  };

  const handleDeleteSavedList = (index) => {
    deleteContactList(index);
    setSavedLists(loadContactsFromStorage());
    toast({
      title: 'List Deleted',
      description: 'Contact list has been removed',
    });
  };

  return (
    <div className="space-y-6">
      {inputSource === 'paste' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Phone Numbers (one per line)
            </label>
            <textarea
              value={textInput}
              onChange={handleTextChange}
              placeholder="+254712345678&#10;+254723456789&#10;+254734567890"
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none font-mono text-sm"
            />
            <p className="text-sm text-gray-600 mt-2">
              We'll automatically extract valid phone numbers from your text.
            </p>
          </div>
        </div>
      )}

      {(inputSource === 'csv' || inputSource === 'excel') && (
        <div>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-900 font-medium mb-2">
              Drag and drop your {inputSource.toUpperCase()} file here
            </p>
            <p className="text-sm text-gray-600 mb-4">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={inputSource === 'csv' ? '.csv' : '.xlsx,.xls'}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <FileText className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-sm text-green-700">
                  {parsedData?.data.length || 0} rows found • {parsedData?.headers.length || 0} columns
                </p>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setParsedData(null);
                  setHeaderMapping({});
                }}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {parsedData && parsedData.headers.length > 0 && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden animate-in fade-in">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Map Columns</h3>
                <p className="text-sm text-gray-600">
                  Match your file columns to the correct fields
                </p>
              </div>
              
              <div className="p-4 space-y-4">
                {FIELD_TYPES.map(field => (
                  <div key={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <div className="md:col-span-2">
                      <select
                        value={headerMapping[field.value] || ''}
                        onChange={(e) => handleHeaderMappingChange(e.target.value, field.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                          field.value === 'phone' && !headerMapping.phone 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">-- Select Column --</option>
                        {parsedData.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                      {field.value === 'phone' && !headerMapping.phone && (
                        <p className="text-xs text-red-600 mt-1">
                          Required: Select the column containing phone numbers
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {inputSource === 'saved' && (
        <div className="space-y-4">
          {savedLists.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-900 font-medium">No Saved Contact Lists</p>
              <p className="text-sm text-gray-600 mt-2">
                Upload contacts and save them for future use
              </p>
            </div>
          ) : (
            savedLists.map((list, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{list.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {list.count} contacts • {new Date(list.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleLoadSavedList(list)}
                      size="sm"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleDeleteSavedList(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {inputSource !== 'saved' && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleConfirm}
            size="lg"
            disabled={
              isLoading ||
              (inputSource === 'paste' && !textInput.trim()) ||
              ((inputSource === 'csv' || inputSource === 'excel') && !parsedData)
            }
          >
            Confirm & Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default InputForm;