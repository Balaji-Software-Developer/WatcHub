import axios from 'axios';

export async function fetchFromTMDB(url, retries = 3, delay = 1000) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 seconds timeout
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNRESET' && retries > 0) {
            console.log(`Connection reset by TMDB API, retrying... (${retries} attempts left)`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Retry with one fewer attempt
            return fetchFromTMDB(url, retries - 1, delay * 2);
        }
        
        console.error('TMDB API Error:', error.message);
        throw error;
    }
}

export function safeEncodeURIComponent(query) {
    return encodeURIComponent(query.trim());
}