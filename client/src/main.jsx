import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#131C18', border: '1px solid #1E2D27', color: '#C8DDD6', fontFamily: 'DM Sans' },
              success: { iconTheme: { primary: '#00D46A', secondary: '#0A0F0D' } },
              error:   { iconTheme: { primary: '#FF4D4D', secondary: '#fff' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
