import { fetchFromTMDB } from "../services/tmdb.service.js";

// Helper functions that can be used by other controllers
export async function searchMovies(query) {
  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return [];
    }
    
    return response.results;
  } catch (error) {
    console.log("Error in searchMovies service: ", error.message);
    throw new Error("Failed to search movies");
  }
}

export async function searchTvShows(query) {
  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/tv?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return [];
    }
    
    return response.results;
  } catch (error) {
    console.log("Error in searchTvShows service: ", error.message);
    throw new Error("Failed to search TV shows");
  }
}

export async function searchPeople(query) {
  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/person?query=${query}&include_adult=false&language=en-US&page=1`
    );

    if (response.results.length === 0) {
      return [];
    }
    
    return response.results;
  } catch (error) {
    console.log("Error in searchPeople service: ", error.message);
    throw new Error("Failed to search people");
  }
}