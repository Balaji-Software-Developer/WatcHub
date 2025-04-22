import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DownloadButton = ({ contentId, contentType, title }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  // Remove the unused downloadId state variable
  const [pollingInterval, setPollingInterval] = useState(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      setProgress(0);
      
      const token = localStorage.getItem('token'); // Assuming JWT auth
      
      // Construct the API URL based on the content type
      let endpoint = '';
      if (contentType === 'movie') {
        endpoint = `/api/v1/download/movie/${contentId}`;
      } else if (contentType === 'tv') {
        // Assuming TV shows use a specific format
        endpoint = `/api/v1/download/tv/${contentId}`;
      } else {
        throw new Error('Unsupported content type');
      }
      
      const response = await axios.get(
        endpoint,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Store download information
      const downloadInfo = response.data;
      const downloadId = downloadInfo.downloadId; // Use local variable instead of state
      
      // Start polling for download progress
      const interval = setInterval(async () => {
        try {
          const progressResponse = await axios.get(
            `/api/v1/download/progress/${downloadId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          const data = progressResponse.data;
          
          if (data.success && data.download) {
            setProgress(data.download.progress || 0);
            
            // Handle download completion
            if (data.download.status === 'completed') {
              clearInterval(interval);
              setDownloading(false);
              setDownloadUrl(`/downloads/${data.download.filename}`);
            }
            
            // Handle download failure
            if (data.download.status === 'failed') {
              clearInterval(interval);
              setDownloading(false);
              setError(data.download.error || 'Download failed');
            }
          }
          
        } catch (pollError) {
          console.error('Error polling download status:', pollError);
          // Don't stop polling on network errors
        }
      }, 2000);
      
      setPollingInterval(interval);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed to start');
      setDownloading(false);
    }
  };

  const initiateFileDownload = () => {
    if (downloadUrl) {
      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${title}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="download-container">
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => handleDownload()}>Try Again</button>
        </div>
      )}
      
      {downloadUrl && (
        <button 
          onClick={initiateFileDownload}
          className="download-complete-btn"
        >
          <i className="fas fa-save"></i> Save to Device
        </button>
      )}
      
      {downloading ? (
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
          <p className="download-title">Downloading: {title}</p>
        </div>
      ) : (
        !downloadUrl && !error && (
          <button 
            className="download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            <i className="fas fa-download"></i> Download
          </button>
        )
      )}
    </div>
  );
};

export default DownloadButton;