import ScrollToTop from './components/ScrollToTop';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BulkWhatsAppSenderPage from './pages/BulkWhatsAppSenderPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/bulk-whatsapp" element={<BulkWhatsAppSenderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;