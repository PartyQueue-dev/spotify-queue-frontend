// File: src/App.js (Frontend)

import React, { useState, useEffect } from 'react';

const API_URL = 'https://spotify-queue-server.onrender.com';

export default function App() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [votes, setVotes] = useState({});

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue();
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchVotes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/votes`);
      const data = await res.json();
      setVotes(data);
    } catch (err) {
      console.error('Failed to fetch votes', err);
    }
  };

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
      await fetchQueue(); // instantly refresh after adding a song
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
      if (data.currently_playing) {
        setNowPlaying({
          name: data.currently_playing.name,
          artists: data.currently_playing.artists?.map(a => a.name) || [],
          uri: data.currently_playing.uri
        });
      } else {
        setNowPlaying(null);
      }
      await fetchVotes();
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  const upvote = async (uri) => {
    if (!localStorage.getItem(`voted_${uri}`)) {
      try {
        const res = await fetch(`${API_URL}/api/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri })
        });
        const data = await res.json();
        setVotes(prev => ({ ...prev, [uri]: (prev[uri] || 0) + 1 }));
        localStorage.setItem(`voted_${uri}`, 'true');
        setMessage('Vote recorded!');
        await fetchQueue(); // instantly refresh after voting
      } catch (err) {
        console.error('Failed to send vote', err);
        setMessage('Error sending vote.');
      }
    } else {
      setMessage('You have already voted for this song.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-4 gap-8">
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

        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold mb-2">Scan to Join In! 📷</h2>
          <img src="/qr-code.png" alt="PartyQueue QR" className="w-48 h-48 mx-auto" />
          <p className="text-gray-500 mt-2">Open your camera or QR app to request a song!</p>
        </div>
      </div>

      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold mb-4">Current Queue</h2>
        <button onClick={fetchQueue} className="bg-gray-700 text-white px-4 py-2 rounded mb-4">
          Refresh Queue
        </button>
        <div className="text-left mt-4">
          {nowPlaying && (
            <div className="mb-4">
              <h3 className="font-semibold">Now Playing:</h3>
              <div>{nowPlaying.name} — <span className="text-gray-600 text-sm">{nowPlaying.artists.join(', ')}</span></div>
            </div>
          )}
          <hr className="my-4" />
          <h3 className="font-semibold mb-2">Coming Up:</h3>
          {queue.length === 0 ? (
            <p className="text-gray-500">No songs in queue</p>
          ) : (
            queue.map((track, index) => (
              <div key={index} className="border-b py-2">
                <div className="flex justify-between items-center">
                  <div>
                    {track.name} — <span className="text-gray-600 text-sm">{track.artists?.map(a => a.name).join(', ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      Votes: {votes[track.uri] || 0} {votes[track.uri] >= 5 ? '🔥' : ''}
                    </div>
                    <button
                      onClick={() => upvote(track.uri)}
                      className="text-blue-600 text-xs mt-1"
                    >
                      Upvote
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
