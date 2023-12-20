import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./Keycloak"


import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <ReactKeycloakProvider authClient={keycloak}>
    <Router>
      <App />
    </Router>
  </ReactKeycloakProvider>
  // </React.StrictMode>
);
