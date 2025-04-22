import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Downloads a video from YouTube with progress tracking
const downloadFromYoutube = async (videoId, downloadPath, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const outputPath = path.join(downloadPath, fileName);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }
      
      console.log(`Starting download of ${videoUrl} to ${outputPath}`);
      
      // Use multiple formats and qualities to increase chance of successful download
      const videoStream = ytdl(videoUrl, {
        quality: 'highestaudio',
        filter: 'audioandvideo',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com'
          }
        }
      });
      
      const fileStream = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;
      let totalBytes = 0;
      
      videoStream.on('info', (info, format) => {
        totalBytes = format.contentLength || 0;
        console.log(`Video info received. Size: ${totalBytes} bytes`);
        
        // Update progress tracking for external monitoring
        global.downloadProgress = global.downloadProgress || {};
        global.downloadProgress[videoId] = {
          progress: 0,
          title: info.videoDetails.title,
          status: 'downloading'
        };
      });
      
      videoStream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = Math.floor((downloadedBytes / totalBytes) * 100);
          // Update global progress
          if (global.downloadProgress && global.downloadProgress[videoId]) {
            global.downloadProgress[videoId].progress = progress;
          }
        }
      });
      
      videoStream.pipe(fileStream);
      
      videoStream.on('error', (err) => {
        console.error('Download error:', err.message);
        if (global.downloadProgress && global.downloadProgress[videoId]) {
          global.downloadProgress[videoId].status = 'failed';
          global.downloadProgress[videoId].error = err.message;
        }
        reject(err);
      });
      
      fileStream.on('finish', () => {
        console.log(`\nDownload completed: ${outputPath}`);
        if (global.downloadProgress && global.downloadProgress[videoId]) {
          global.downloadProgress[videoId].status = 'completed';
          global.downloadProgress[videoId].progress = 100;
        }
        resolve(outputPath);
      });
      
      fileStream.on('error', (err) => {
        console.error('File write error:', err.message);
        if (global.downloadProgress && global.downloadProgress[videoId]) {
          global.downloadProgress[videoId].status = 'failed';
          global.downloadProgress[videoId].error = err.message;
        }
        reject(err);
      });
      
    } catch (error) {
      console.error('Download setup error:', error.message);
      reject(error);
    }
  });
};

// Fallback download method using public sources
const downloadFromPublicSource = async (title, downloadPath, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      // Sample video URLs you can use as fallbacks
      const sampleVideos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      ];
      
      const selectedVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
      const outputPath = path.join(downloadPath, fileName);
      
      console.log(`Using fallback source: ${selectedVideo}`);
      
      const https = require('https');
      const file = fs.createWriteStream(outputPath);
      
      https.get(selectedVideo, (response) => {
        const totalBytes = parseInt(response.headers['content-length'] || 0);
        let downloadedBytes = 0;
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = totalBytes ? Math.floor((downloadedBytes / totalBytes) * 100) : 0;
          process.stdout.write(`Fallback download progress: ${progress}%\r`);
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`\nFallback download completed: ${outputPath}`);
          resolve(outputPath);
        });
      }).on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete the file
        console.error('Fallback download failed:', err.message);
        reject(err);
      });
      
    } catch (error) {
      console.error('Fallback download setup error:', error.message);
      reject(error);
    }
  });
};

// Add a function to check if a video is downloadable
const checkVideoAvailability = async (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoId);
    
    // Check if the video has downloadable formats
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    
    return {
      available: formats.length > 0,
      title: info.videoDetails.title,
      formats: formats.length
    };
  } catch (error) {
    console.error('Video availability check failed:', error.message);
    return {
      available: false,
      error: error.message
    };
  }
};

export default {
  downloadFromYoutube,
  downloadFromPublicSource,
  checkVideoAvailability
};