import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, StopCircle, Download, AlertTriangle, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import {
  openWhatsAppWeb,
  getRandomDelay,
  getCooldownDelay,
  estimateSendingTime,
  delay
} from '../utils/whatsappUtils';

function BulkSender({ contacts, messages }) {
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({
    sent: 0,
    failed: 0,
    pending: contacts.length,
    total: contacts.length
  });
  const [log, setLog] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(null);

  const sendingRef = useRef(false);
  const pausedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      const estimate = estimateSendingTime(contacts.length);
      setEstimatedTime(estimate);
    }
  }, [contacts]);

  const addLog = (phone, status, message = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [
      { phone, status, message, timestamp },
      ...prev.slice(0, 99) // Keep last 100 logs
    ]);
  };

  const handleStart = async () => {
    if (contacts.length === 0 || messages.length === 0) {
      return;
    }

    setSending(true);
    sendingRef.current = true;
    pausedRef.current = false;
    
    addLog('SYSTEM', 'info', `Starting bulk send to ${contacts.length} contacts...`);
    toast({
      title: 'Sending Started',
      description: 'Opening WhatsApp Web for each contact...',
    });

    let sent = progress.sent;
    let failed = progress.failed;

    // Start from where we left off if resuming (index based on sent+failed)
    const startIndex = sent + failed;

    for (let i = startIndex; i < contacts.length; i++) {
      // Check if stopped
      if (!sendingRef.current) {
        addLog('SYSTEM', 'info', 'Sending stopped by user');
        break;
      }

      // Check if paused
      while (pausedRef.current) {
        if (!sendingRef.current) break;
        await delay(500);
      }
      if (!sendingRef.current) break;

      const contact = contacts[i];
      const message = messages[i];

      try {
        addLog(contact.phone, 'sending', 'Preparing message...');

        // 1. Open WhatsApp Web with pre-filled message
        const opened = openWhatsAppWeb(contact.phone, message.message);

        if (opened) {
          sent++;
          addLog(contact.phone, 'sent', 'Opened in WhatsApp Web');
        } else {
          failed++;
          addLog(contact.phone, 'failed', 'Popup blocked or failed to open');
          toast({
            title: 'Popup Blocked',
            description: 'Please allow popups for this site to open WhatsApp Web',
            variant: 'destructive',
          });
        }

        // Update progress
        setProgress({
          sent,
          failed,
          pending: contacts.length - sent - failed,
          total: contacts.length
        });

        // 2. Delay Logic (Semi-automated flow)
        if (i < contacts.length - 1) {
          // Random delay between messages (5-15 seconds)
          const randomDelay = getRandomDelay(5000, 15000);
          
          // Show countdown in log
          for (let s = Math.round(randomDelay/1000); s > 0; s--) {
            if (!sendingRef.current) break;
            // Optional: Update a temporary status instead of flooding log
            await delay(1000);
          }
          
          if (!sendingRef.current) break;

          // Check for cooldown after every 20 messages
          const cooldown = getCooldownDelay(sent);
          if (cooldown > 0) {
            addLog('SYSTEM', 'info', `Cooling down for ${Math.round(cooldown / 1000)}s to prevent spam detection...`);
            await delay(cooldown);
          }
        }

      } catch (error) {
        failed++;
        addLog(contact.phone, 'failed', error.message);
        
        setProgress({
          sent,
          failed,
          pending: contacts.length - sent - failed,
          total: contacts.length
        });
      }
    }

    finishSending(sent, failed);
  };

  const finishSending = (sent, failed) => {
    // Save report to localStorage
    try {
      const report = {
        timestamp: new Date().toISOString(),
        totalContacts: contacts.length,
        sent,
        failed,
        log: log.slice(0, 50)
      };

      const reports = JSON.parse(localStorage.getItem('bulkWhatsApp_reports') || '[]');
      reports.push(report);
      localStorage.setItem('bulkWhatsApp_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save report:', error);
    }

    setSending(false);
    sendingRef.current = false;
    
    if (sent + failed === contacts.length) {
      toast({
        title: 'Batch Complete',
        description: `Processed ${contacts.length} contacts.`,
      });
      addLog('SYSTEM', 'info', `Batch complete: ${sent} sent, ${failed} failed`);
    }
  };

  const handlePause = () => {
    setPaused(!paused);
    pausedRef.current = !paused;
    
    if (!paused) {
      addLog('SYSTEM', 'info', 'Sending paused by user');
    } else {
      addLog('SYSTEM', 'info', 'Resuming...');
    }
  };

  const handleStop = () => {
    setSending(false);
    sendingRef.current = false;
    pausedRef.current = false;
    setPaused(false);
  };

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: progress,
      log
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-report-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercent = progress.total > 0
    ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sending Progress</h3>
            <p className="text-sm text-gray-500">
              {sending ? 'Active' : 'Idle'} • {progressPercent}% Complete
            </p>
          </div>
          <div className="flex gap-2">
            {!sending ? (
              <Button 
                onClick={handleStart} 
                size="lg" 
                className={progressPercent === 100 ? "bg-green-600 hover:bg-green-700" : ""}
                disabled={progressPercent === 100}
              >
                {progressPercent === 100 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {progress.sent > 0 ? 'Resume Sending' : 'Start Sending'}
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handlePause} variant="outline" size="lg">
                  <Pause className="w-5 h-5 mr-2" />
                  {paused ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={handleStop} variant="destructive" size="lg">
                  <StopCircle className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Opened</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{progress.sent}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{progress.failed}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-700">{progress.pending}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
             <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{progress.total}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              Task Progress
            </span>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {progressPercent}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-amber-900">Semi-Automated Mode Active</h4>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Due to WhatsApp security measures, this tool will <strong>open</strong> the chats for you, but you must click the <strong>Send button</strong> manually in the WhatsApp Web window.
          </p>
          <p className="text-sm text-amber-700 mt-2">
            <strong>Tip:</strong> Keep the WhatsApp Web window open. The tool will reuse it if possible.
          </p>
        </div>
      </div>

      {/* Log */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700">
        <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-200">Live Activity Log</h3>
          <Button onClick={downloadReport} size="sm" variant="ghost" className="text-gray-300 hover:text-white h-8">
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1.5 custom-scrollbar">
          {log.length === 0 ? (
            <p className="text-gray-500 italic">Waiting to start...</p>
          ) : (
            log.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-gray-500 flex-shrink-0">[{entry.timestamp}]</span>
                <span className={`flex-shrink-0 w-32 ${
                  entry.status === 'sent' ? 'text-green-400' :
                  entry.status === 'failed' ? 'text-red-400' :
                  entry.status === 'sending' ? 'text-blue-400' :
                  'text-yellow-400'
                }`}>
                  {entry.phone}
                </span>
                <span className="text-gray-300 truncate">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkSender;