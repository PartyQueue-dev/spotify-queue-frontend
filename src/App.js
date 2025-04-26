// File: src/App.js (Frontend)

import React, { useState } from 'react';

const API_URL = 'https://spotify-queue-server.onrender.com';

export default function App() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [queue, setQueue] = useState([]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(data.tracks);
    } catch (err) {
      console.error('Search failed:', err);
      setMessage('Error searching for songs.');
    }
  };

  const addToQueue = async (uri) => {
    try {
      const res = await fetch(`${API_URL}/api/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
      const data = await res.json();
      setMessage(data.message || 'Song added.');
    } catch (err) {
      console.error('Failed to add to queue:', err);
      setMessage('Error adding song to queue.');
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/api/queue-view`);
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row max-w-4xl mx-auto p-4 gap-8">

      <div className="flex-1 text-center">
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

      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold mb-4">Current Queue</h2>
        <button onClick={fetchQueue} className="bg-gray-700 text-white px-4 py-2 rounded mb-4">
          Refresh Queue
        </button>
        <div>
          {queue.length === 0 ? (
            <p className="text-gray-500">No songs in queue</p>
          ) : (
            queue.map((track, index) => (
              <div key={index} className="border-b py-2">
                {track.name} — <span className="text-gray-600 text-sm">{track.artists?.map(a => a.name).join(', ')}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
