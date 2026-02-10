import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  FileText,
  Send,
  Settings
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

import InputSourceSelector from '../components/InputSourceSelector';
import InputForm from '../components/InputForm';
import TemplateEditor from '../components/TemplateEditor';
import MessagePreview from '../components/MessagePreview';
import BulkSender from '../components/BulkSender';

import {
  deduplicateContacts,
  validateContacts,
  formatContactsForSending,
  saveContactsToStorage
} from '../utils/contactUtils';

import { generatePreview } from '../utils/templateUtils';

const STEPS = [
  { id: 1, name: 'Input Source', description: 'Choose import method' },
  { id: 2, name: 'Load Contacts', description: 'Upload & Map Data' },
  { id: 3, name: 'Template', description: 'Compose Message' },
  { id: 4, name: 'Preview', description: 'Verify Output' },
  { id: 5, name: 'Send', description: 'Start Campaign' }
];

function BulkWhatsAppSenderPage() {
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [inputSource, setInputSource] = useState('paste');
  const [contacts, setContacts] = useState([]);
  const [template, setTemplate] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  /* ---------------- CONTACT HANDLING ---------------- */

  const handleContactsLoaded = (loadedContacts) => {
    const deduplicated = deduplicateContacts(loadedContacts);
    const { valid, invalid } = validateContacts(deduplicated);

    if (invalid.length > 0) {
      toast({
        title: 'Contacts Skipped',
        description: `${invalid.length} contacts had invalid phone numbers.`,
        variant: 'destructive'
      });
    }

    if (valid.length === 0) {
      toast({
        title: 'No Valid Contacts',
        description: 'Please provide valid phone numbers.',
        variant: 'destructive'
      });
      return;
    }

    const formatted = formatContactsForSending(valid);
    setContacts(formatted);

    saveContactsToStorage(
      formatted,
      `Auto-save ${new Date().toLocaleTimeString()}`
    );

    toast({
      title: 'Contacts Ready',
      description: `${formatted.length} contacts ready for messaging`
    });

    setCurrentStep(3);
  };

  /* ---------------- PREVIEW FLOW ---------------- */

  const openPreview = () => {
    if (!template.trim()) {
      toast({
        title: 'Template Required',
        description: 'Please write a message template.',
        variant: 'destructive'
      });
      return;
    }

    const previews = generatePreview(template, contacts, 5);
    setPreviewMessages(previews);
    setPreviewConfirmed(false);
    setShowPreview(true);
    setCurrentStep(4);
  };

  const confirmPreview = () => {
    setShowPreview(false);
    setPreviewConfirmed(true);
    setCurrentStep(5);
  };

  /* ---------------- NAVIGATION ---------------- */

  const handleNextStep = () => {
    if (currentStep === 4 && !previewConfirmed) {
      toast({
        title: 'Preview Not Confirmed',
        description: 'You must confirm the preview before sending.',
        variant: 'destructive'
      });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  /* ---------------- FINAL MESSAGE BUILD ---------------- */

  const finalMessages = useMemo(() => {
    if (!contacts.length || !template) return [];
    return generatePreview(template, contacts, contacts.length);
  }, [contacts, template]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Helmet>
        <title>Bulk WhatsApp Sender</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bulk Sender</h1>
          <p className="text-gray-500 mt-1">
            Manage your campaign in 5 easy steps
          </p>
        </div>

        {/* STEPPER */}
        <div className="bg-white border rounded-xl p-4 mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px]">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${currentStep > step.id
                        ? 'bg-green-600 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                        : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div>
                    <div className="font-semibold">{step.name}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-gray-200 mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="bg-white rounded-xl border p-6 min-h-[500px]">

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="text-blue-600" />
                <h2 className="text-xl font-bold">Select Input Source</h2>
              </div>

              <InputSourceSelector
                selectedSource={inputSource}
                onSelectSource={(source) => {
                  setInputSource(source);
                  setCurrentStep(2);
                }}
              />
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-blue-600" />
                <h2 className="text-xl font-bold">Import Contacts</h2>
              </div>

              <InputForm
                inputSource={inputSource}
                onContactsLoaded={handleContactsLoaded}
              />

              <div className="mt-6">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-blue-600" />
                <h2 className="text-xl font-bold">Compose Message</h2>
              </div>

              <TemplateEditor
                contacts={contacts}
                template={template}
                onTemplateChange={setTemplate}
                onPreview={openPreview}
              />
            </div>
          )}

          {/* STEP 4 (STATIC REVIEW SCREEN STILL SHOWN) */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Final Review</h2>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <span className="text-sm text-gray-500">Recipients</span>
                  <div className="text-2xl font-bold">{contacts.length}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estimated Time</span>
                  <div className="text-2xl font-bold">
                    ~{Math.ceil((contacts.length * 15) / 60)} min
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <div className="text-green-600 font-semibold">
                    Waiting for confirmation
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={handlePrevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Send className="text-green-600" />
                <h2 className="text-xl font-bold">Sending Campaign</h2>
              </div>

              <BulkSender contacts={contacts} messages={finalMessages} />

              <div className="mt-8">
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                  Start New Campaign
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <MessagePreview
          previews={previewMessages}
          totalCount={contacts.length}
          onClose={() => setShowPreview(false)}
          onConfirm={confirmPreview}
        />
      )}
    </div>
  );
}

export default BulkWhatsAppSenderPage;
