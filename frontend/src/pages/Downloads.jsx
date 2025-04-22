import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Downloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/downloads/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDownloads(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch downloads:', err);
        setLoading(false);
      }
    };
    
    fetchDownloads();
  }, []);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="downloads-page">
      <h1>My Downloads</h1>
      
      {downloads.length === 0 ? (
        <p>No downloads yet. Start downloading your favorite content!</p>
      ) : (
        <div className="downloads-list">
          {downloads.map(download => (
            <div key={download._id} className="download-item">
              <img 
                src={download.posterPath} 
                alt={download.title} 
              />
              <div className="download-details">
                <h3>{download.title}</h3>
                <p>Status: {download.status}</p>
                <p>Downloaded on: {new Date(download.createdAt).toLocaleDateString()}</p>
                <p>File size: {download.fileSize}</p>
                <button className="play-btn">Play</button>
                <button className="delete-btn">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;