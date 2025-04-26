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
    const interval = setInterval(fetchQueue, 5000);
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
      await fetchQueue();
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
      setNowPlaying(data.currently_playing || null);
      await fetchVotes();
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  const upvote = async (uri) => {
    if (!localStorage.getItem(`voted_${uri}`)) {
      try {
        await fetch(`${API_URL}/api/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri })
        });
        setVotes(prev => ({ ...prev, [uri]: (prev[uri] || 0) + 1 }));
        localStorage.setItem(`voted_${uri}`, 'true');
        setMessage('Vote recorded!');
        await fetchQueue();
      } catch (err) {
        console.error('Failed to send vote', err);
        setMessage('Error sending vote.');
      }
    } else {
      setMessage('You have already voted for this song.');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8 max-w-screen-xl mx-auto h-screen p-8">
      {/* LEFT SIDE */}
      <div className="col-span-9 overflow-y-auto">
        <div className="text-center">
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

        <div className="text-center mt-8">
          <h2 className="text-lg font-semibold mb-4">Current Queue</h2>
          <button onClick={fetchQueue} className="bg-gray-700 text-white px-4 py-2 rounded mb-4">
            Refresh Queue
          </button>
          <div className="text-left mt-4">
            {nowPlaying && (
              <div className="mb-4">
                <h3 className="font-semibold">Now Playing:</h3>
                <div>{nowPlaying.name} — <span className="text-gray-600 text-sm">{nowPlaying.artists.map(a => a.name).join(', ')}</span></div>
              </div>
            )}
            <hr className="my-4" />
            <h3 className="font-semibold mb-2">Coming Up:</h3>
            {queue.length === 0 ? (
              <p className="text-gray-500">No songs in queue</p>
            ) : (
              queue.map((track, index) => (
                <div key={index} className="border-b py-2 flex justify-between items-center">
                  <div>
                    {track.name} — <span className="text-gray-600 text-sm">{track.artists.map(a => a.name).join(', ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Votes: {votes[track.uri] || 0}</div>
                    <button onClick={() => upvote(track.uri)} className="text-blue-600 text-xs">
                      Upvote
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: QR Code */}
      <div className="col-span-3 flex flex-col items-center justify-start pt-8">
        <h2 className="text-2xl font-bold mb-4">Scan to Join In! 📷</h2>
        <img src="/qr-code.png" alt="PartyQueue QR" className="w-48 h-48 mb-2" />
        <p className="text-gray-500 text-center">Open your camera to request a song!</p>
      </div>
    </div>
  );
}
