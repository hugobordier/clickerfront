import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainRouter from './MainRouter';
import { WebSocketProvider } from './context/WebSocketContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <WebSocketProvider>
    <MainRouter />
    </WebSocketProvider>
  </React.StrictMode>
);
