const axios = require('axios');

const youtubeService = {
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoId,
            key: process.env.YOUTUBE_API_KEY
          }
        }
      );
      
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      return response.data.items[0];
    } catch (error) {
      console.error('YouTube API error:', error);
      throw error;
    }
  },
  
  async searchVideos(query, maxResults = 5) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults,
            key: process.env.YOUTUBE_API_KEY
          }
        }
      );
      
      return response.data.items;
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  },
  
  // Get trailer for a movie
  async getMovieTrailer(movieTitle) {
    try {
      const query = `${movieTitle} official trailer`;
      const videos = await this.searchVideos(query, 1);
      
      if (videos && videos.length > 0) {
        return videos[0].id.videoId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting movie trailer:', error);
      throw error;
    }
  }
};

module.exports = youtubeService;