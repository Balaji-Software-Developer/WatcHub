// frontend/src/components/VideoPlayer.js

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './VideoPlayer.css';

const VideoPlayer = ({ videoId, onClose }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchVideo = async () => {
      try {
        setLoading(true);
        
        const downloadResponse = await fetch(`/api/v1/download/movie/${videoId}`);
        const downloadData = await downloadResponse.json();
        
        if (!downloadResponse.ok) {
          throw new Error(downloadData.message || 'Failed to download video');
        }
        
        if (isMounted) {
          setVideoUrl(`/api/v1/videos/${downloadData.fileName}`);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading video:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load video');
          setLoading(false);
          toast.error('Failed to load video. Please try again.');
        }
      }
    };
    
    if (videoId) {
      fetchVideo();
    }
    
    // Using a ref for the cleanupFunction to satisfy ESLint
    const cleanupFunction = () => {
      isMounted = false;
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
    
    return cleanupFunction;
  }, [videoId]);
  
  const handleVideoError = () => {
    setError('This video cannot be played. The file may be corrupted or in an unsupported format.');
    toast.error('Video playback error');
  };
  
  if (loading) {
    return (
      <div className="video-player-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="video-player-container error">
        <div className="error-message">
          <h3>Can't play video</h3>
          <p>{error}</p>
          <p>Error code: 0xc10100be</p>
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="video-player-container">
      <div className="video-controls">
        <button onClick={onClose} className="close-button">✕</button>
      </div>
      <video
        ref={videoRef}
        className="video-element"
        controls
        autoPlay
        onError={handleVideoError}
        src={videoUrl}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;