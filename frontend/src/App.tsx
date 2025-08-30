import React from 'react';

export default function App() {
  const [health, setHealth] = React.useState<string>('—');

  async function ping() {
    try {
      const r = await fetch('/api/health');
      const j = await r.json();
      setHealth(JSON.stringify(j, null, 2));
    } catch {
      setHealth('error');
    }
  }

  return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>kptournir</h1>
        <p>Vite + React + TS</p>
        <button onClick={ping}>Проверить API</button>
        <pre>{health}</pre>
      </div>
  );
}