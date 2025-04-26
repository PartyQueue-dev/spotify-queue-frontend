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
    }, 5000);
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
        await fetchQueue();
      } catch (err) {
        console.error('Failed to send vote', err);
        setMessage('Error sending vote.');
      }
    } else {
      setMessage('You have already voted for this song.');
    }
  };

  // Using inline styles instead of Tailwind to ensure they work
  const containerStyle = {
    display: 'flex',
    width: '100%',
    height: '100vh',
    overflow: 'hidden'
  };

  const leftColumnStyle = {
    flex: '1',
    padding: '2rem',
    overflowY: 'auto'
  };

  const rightColumnStyle = {
    width: '400px',
    backgroundColor: '#f9fafb',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  return (
    <div style={containerStyle}>
      {/* LEFT SIDE - Song Request */}
      <div style={leftColumnStyle}>
        <div style={{textAlign: 'center'}}>
          <h1 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>Request a Song</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{border: '1px solid #ccc', padding: '0.5rem', width: '100%', marginBottom: '0.5rem'}}
          />
          <button 
            onClick={handleSearch} 
            style={{backgroundColor: 'black', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', marginBottom: '1rem'}}
          >
            Search
          </button>
          {results.map((track) => (
            <div key={track.uri} style={{borderBottom: '1px solid #eee', padding: '0.5rem 0'}}>
              <div>{track.name} — <span style={{color: '#666', fontSize: '0.875rem'}}>{track.artist}</span></div>
              <button
                onClick={() => addToQueue(track.uri)}
                style={{color: 'green', fontSize: '0.875rem', marginTop: '0.25rem'}}
              >
                Add to Queue
              </button>
            </div>
          ))}
          {message && <div style={{marginTop: '1rem', color: 'green'}}>{message}</div>}
        </div>

        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem'}}>Current Queue</h2>
          <button 
            onClick={fetchQueue} 
            style={{backgroundColor: '#4b5563', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', marginBottom: '1rem'}}
          >
            Refresh Queue
          </button>
          <div style={{textAlign: 'left', marginTop: '1rem'}}>
            {nowPlaying && (
              <div style={{marginBottom: '1rem'}}>
                <h3 style={{fontWeight: 600}}>Now Playing:</h3>
                <div>{nowPlaying.name} — <span style={{color: '#666', fontSize: '0.875rem'}}>{nowPlaying.artists.join(', ')}</span></div>
              </div>
            )}
            <hr style={{margin: '1rem 0'}} />
            <h3 style={{fontWeight: 600, marginBottom: '0.5rem'}}>Coming Up:</h3>
            {queue.length === 0 ? (
              <p style={{color: '#6b7280'}}>No songs in queue</p>
            ) : (
              queue.map((track, index) => (
                <div key={index} style={{borderBottom: '1px solid #eee', padding: '0.5rem 0'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      {track.name} — <span style={{color: '#666', fontSize: '0.875rem'}}>{track.artists?.map(a => a.name).join(', ')}</span>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '0.875rem'}}>
                        Votes: {votes[track.uri] || 0} {votes[track.uri] >= 5 ? '🔥' : ''}
                      </div>
                      <button
                        onClick={() => upvote(track.uri)}
                        style={{color: 'blue', fontSize: '0.75rem', marginTop: '0.25rem'}}
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

      {/* RIGHT SIDE: QR Code - Fixed width */}
      <div style={rightColumnStyle}>
        <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem'}}>Scan to Join In! 📷</h2>
        <img src="/qr-code.png" alt="PartyQueue QR" style={{width: '12rem', height: '12rem', marginBottom: '0.5rem'}} />
        <p style={{color: '#6b7280', textAlign: 'center'}}>Open your camera to request a song!</p>
      </div>
    </div>
  );
}
