// Minimal Frontend for Spotify Queue Web App (React)

import React, { useState } from 'react';

export default function App() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!search.trim()) return;
    setMessage('');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/search?query=${encodeURIComponent(search)}`);
    const data = await res.json();
    setResults(data.tracks);
  };

  const addToQueue = async (uri) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });
    const data = await res.json();
    setMessage(data.message || 'Song added.');
  };

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-xl font-semibold mb-4">Request a Song</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="border p-2 w-full mb-2"
      />
      <button onClick={handleSearch} className="bg-black text-white px-4 py-2 rounded mb-4">
        Search
      </button>
      {results.map((track) => (
        <div key={track.uri} className="border-b py-2">
          <div>{track.name} — <span className="text-gray-600 text-sm">{track.artist}</span></div>
          <button
            onClick={() => addToQueue(track.uri)}
            className="text-green-600 text-sm mt-1"
          >
            Add to Queue
          </button>
        </div>
      ))}
      {message && <div className="mt-4 text-green-700">{message}</div>}
    </div>
  );
}
