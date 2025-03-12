import axios from 'axios';

export async function fetchFromTMDB(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });
        return response.data;
    } catch (error) {
        console.error('TMDB API Error:', error.message);
        throw error;
    }
}

export function safeEncodeURIComponent(query) {
    return encodeURIComponent(query.trim());
}