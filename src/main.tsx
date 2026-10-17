import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { handOffBearer, takeBearerFromFragment } from './auth/bearerFragment';
import './styles/tokens.css';
import './styles/global.css';

// Before anything renders: take a landing page's one-time bearer out of the URI
// fragment and history, so no later code can read it from `location` (ADR-013,
// security model).
const bearer = handOffBearer(takeBearerFromFragment(window.location, window.history));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App bearer={bearer} />
  </StrictMode>,
);
