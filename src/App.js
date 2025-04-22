import React, { useState } from 'react';

export default function App() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!search.trim()) return;
    setMessage('');
    const res = await fetch(`/api/search?query=${encodeURIComponent(search)}`);
    const data = await res.json();
    setResults(data.tracks);
  };

  const addToQueue = async (uri) => {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });
    const data = await res.json();
    setMessage(data.message || 'Song added.');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <h1>Request a Song</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for a track..."
        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
      />
      <button onClick={handleSearch}>Search</button>

      {results.map((track) => (
        <div key={track.uri} style={{ marginTop: 10, paddingBottom: 10, borderBottom: '1px solid #ddd' }}>
          <div>{track.name} — <small>{track.artist}</small></div>
          <button onClick={() => addToQueue(track.uri)}>Add to Queue</button>
        </div>
      ))}

      {message && <p style={{ marginTop: '1rem', color: 'green' }}>{message}</p>}
    </div>
  );
}
