import axios from 'axios';
import { ENV_VARS } from '../config/envVars.js';

export const downloadMedia = async (req, res) => {
    try {
        const { contentType, id } = req.params;
        
        // Validate content type
        if (contentType !== 'movie' && contentType !== 'tv') {
            return res.status(400).json({ message: 'Invalid content type' });
        }
        
        // Get media details from TMDB
        const tmdbApiUrl = `https://api.themoviedb.org/3/${contentType}/${id}`;
        
        let mediaInfo;
        try {
            const accessToken = ENV_VARS.TMDB_READ_ACCESS_TOKEN;
            if (!accessToken) {
                throw new Error('TMDB access token is not defined');
            }
            
            mediaInfo = await axios.get(tmdbApiUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Failed to fetch media info from TMDB:', error);
            return res.status(404).json({ message: 'Media not found or API authentication failed' });
        }
        
        const title = mediaInfo.data.title || mediaInfo.data.name;
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
        
        // For a real application, you would need to either:
        // 1. Have the actual video files stored somewhere
        // 2. Stream from a video provider service
        
        // This example uses a publicly available sample video
        // In production, replace this with your actual video source
        const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        
        try {
            // Stream the video from source to client
            const videoResponse = await axios({
                method: 'get',
                url: sampleVideoUrl,
                responseType: 'stream'
            });
            
            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Length', videoResponse.headers['content-length']);
            
            // Pipe the video stream to the response
            videoResponse.data.pipe(res);
        } catch (error) {
            console.error('Error streaming video:', error);
            return res.status(500).json({ message: 'Failed to stream video' });
        }
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(400).json({ message: 'Download failed. Please try again later.' });
    }
};