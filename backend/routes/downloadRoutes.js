// backend/routes/downloadRoutes.js

import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const router = express.Router();

// Create downloads directory if it doesn't exist
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  console.log(`📁 Created downloads directory at: ${DOWNLOAD_DIR}`);
}

// Configure axios with retry logic
const axiosInstance = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Authorization': `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
    'Accept': 'application/json'
  }
});

// Retry mechanism for API requests
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await axiosInstance(url, options);
    } catch (error) {
      lastError = error;
      const isConnectionReset = error.code === 'ECONNRESET';
      
      if (isConnectionReset && attempt < maxRetries - 1) {
        console.log(`Connection reset by TMDB API, retrying... (${maxRetries - attempt - 1} attempts left)`);
        // Wait for a short time before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
};

// Movie download endpoint
router.get('/movie/:id', async (req, res) => {
  const movieId = req.params.id;
  
  try {
    // Get movie details first (title, etc)
    const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}`;
    const movieResponse = await fetchWithRetry(movieUrl);
    const movie = movieResponse.data;
    
    // Create a safe filename
    const safeTitle = movie.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
    const fileName = `${safeTitle}_${movieId}.mp4`;
    
    // Since we don't have actual movie files from TMDB (they're just metadata),
    // we'll download a placeholder video for demonstration
    
    // In a real app, you'd get the video URL from somewhere else
    // For demo purposes, we'll use a sample video
    // Try a different sample video URL that is known to work
    const videoUrl = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4';
    
    try {
      // Stream the video directly to the client
      const videoResponse = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 60000, // 60 second timeout for large files
      });
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'video/mp4');
      
      // Pipe the video stream directly to the response
      videoResponse.data.pipe(res);
      
      // Handle errors in the stream
      videoResponse.data.on('error', (err) => {
        console.error('Stream error:', err);
        // Note: Can't send error headers if streaming has started
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Video stream error'
          });
        }
      });
      
    } catch (downloadError) {
      console.error(`Download error:`, downloadError);
      res.status(404).json({
        success: false,
        message: 'Video not available for download. Please try a different movie.',
        error: downloadError.message
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download movie'
    });
  }
});

export default router;