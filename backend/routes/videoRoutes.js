import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get download directory
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'downloads');

// List all available videos
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR)
      .filter(file => file.endsWith('.mp4'))
      .map(file => {
        const stats = fs.statSync(path.join(DOWNLOAD_DIR, file));
        return {
          fileName: file,
          size: stats.size,
          createdAt: stats.birthtime
        };
      });
      
    res.json({ success: true, files });
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stream video endpoint - proper implementation with range requests
router.get('/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(DOWNLOAD_DIR, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video file not found' 
      });
    }
    
    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    // Parse range header for video seeking functionality
    const range = req.headers.range;
    
    if (range) {
      // Handle range request (important for video streaming)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Prevent excessive chunk size
      const chunkSize = Math.min(end - start + 1, 1024 * 1024); // 1MB max chunk
      const file = fs.createReadStream(filePath, { start, end: start + chunkSize - 1 });
      
      // Set proper headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${start + chunkSize - 1}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      
      // Stream the file chunk
      file.pipe(res);
    } else {
      // For first request without range
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      
      // Stream the whole file
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video',
      error: error.message
    });
  }
});

export default router;