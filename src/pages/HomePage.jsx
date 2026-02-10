import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { MessageSquare, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Helmet>
        <title>Bulk WhatsApp Sender - Send Personalized Messages at Scale</title>
        <meta name="description" content="Send personalized WhatsApp messages to multiple contacts with ease. Import contacts from CSV/Excel, create custom templates, and automate your outreach." />
      </Helmet>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bulk WhatsApp Sender
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Send personalized WhatsApp messages to multiple contacts at scale. 
            Import contacts, customize templates, and reach your audience effectively.
          </p>
          <Link to="/bulk-whatsapp">
            <Button size="lg" className="text-lg px-8 py-6">
              <MessageSquare className="w-6 h-6 mr-2" />
              Get Started
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Personalized Messages
            </h3>
            <p className="text-gray-600">
              Use placeholders to customize each message with contact details
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multiple Import Options
            </h3>
            <p className="text-gray-600">
              Import contacts from CSV, Excel, or paste phone numbers directly
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Safe Sending
            </h3>
            <p className="text-gray-600">
              Built-in delays and cooldown periods to prevent rate limiting
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Template Library
            </h3>
            <p className="text-gray-600">
              Save and reuse message templates for different campaigns
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Import Contacts</h3>
              <p className="text-sm text-gray-600">
                Upload CSV/Excel or paste phone numbers
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Template</h3>
              <p className="text-sm text-gray-600">
                Write your message with personalized placeholders
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Preview Messages</h3>
              <p className="text-sm text-gray-600">
                Review how messages will look for each contact
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Send Messages</h3>
              <p className="text-sm text-gray-600">
                Start bulk sending with smart delays
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Scale Your WhatsApp Outreach?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start sending personalized messages to your contacts today
          </p>
          <Link to="/bulk-whatsapp">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Launch Bulk Sender
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;