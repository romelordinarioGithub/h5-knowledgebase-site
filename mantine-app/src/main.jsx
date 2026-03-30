import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './index.css';
import App from './App.jsx';

const theme = {
  primaryColor: 'grape',
  fontFamily: 'Montserrat, sans-serif',
  colors: {
    grape: [
      '#f2e9ff',
      '#e6d2ff',
      '#d8b8ff',
      '#c99cff',
      '#b77eff',
      '#a35fff',
      '#8f43f2',
      '#7a30d8',
      '#6325b6',
      '#432184',
    ],
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>
);
