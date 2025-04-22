// Backend/controllers/voiceCommandController.js
import { fetchFromTMDB } from "../services/tmdb.service.js";
import { User } from "../models/user.model.js";

export async function processVoiceCommand(req, res) {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        message: 'Voice command is required' 
      });
    }
    
    // Process the command
    const action = determineAction(command);
    let result;

    switch (action.type) {
      case 'SEARCH':
        // Handle search command
        result = await handleSearchCommand(action.term, action.mediaType, req.user);
        break;
      case 'NAVIGATE':
        // Handle navigation command
        result = { 
          redirect: action.destination,
          message: `Navigating to ${action.destination}`
        };
        break;
      default:
        // Default to movie search if command not recognized
        result = await handleSearchCommand(command, 'movie', req.user);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Voice command processed successfully',
      result: result,
      action: action
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process voice command', 
      error: error.message 
    });
  }
}

// Helper function to determine the action based on the command
function determineAction(command) {
  const commandLower = command.toLowerCase();
  
  // Check for search commands
  if (commandLower.includes('search for') || 
      commandLower.includes('find') || 
      commandLower.includes('look for') ||
      commandLower.includes('show me')) {
    
    let mediaType = 'movie'; // Default to movie search
    
    if (commandLower.includes('tv show') || 
        commandLower.includes('series') || 
        commandLower.includes('television')) {
      mediaType = 'tv';
    } else if (commandLower.includes('person') || 
               commandLower.includes('actor') || 
               commandLower.includes('actress') ||
               commandLower.includes('director')) {
      mediaType = 'person';
    }
    
    return { 
      type: 'SEARCH', 
      term: extractSearchTerm(commandLower),
      mediaType: mediaType
    };
  }
  
  // Check for navigation commands
  if (commandLower.includes('go to') || commandLower.includes('navigate to')) {
    let destination = '/';
    
    if (commandLower.includes('home')) {
      destination = '/';
    } else if (commandLower.includes('history')) {
      destination = '/search-history';
    } else if (commandLower.includes('profile')) {
      destination = '/profile';
    }
    
    return { type: 'NAVIGATE', destination };
  }
  
  // If no patterns match, treat the entire command as a search term
  return { 
    type: 'SEARCH', 
    term: command.trim(),
    mediaType: 'movie'
  };
}

// Helper function to extract search terms
function extractSearchTerm(command) {
  const searchPhrases = [
    'search for', 'find', 'look for', 'show me', 
    'search', 'find me', 'look up', 'show'
  ];
  
  for (const phrase of searchPhrases) {
    if (command.includes(phrase)) {
      const parts = command.split(phrase);
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
  }
  
  // If no search phrase is found, return the whole command
  return command.trim();
}

// Handle search commands by type
async function handleSearchCommand(searchTerm, mediaType, user) {
  // Remove filler words from the search term
  const cleanedTerm = searchTerm
    .replace(/^(the|a|an) /i, '')
    .replace(/^for /i, '')
    .trim();
  
  if (!cleanedTerm) {
    return { results: [], message: "No search term provided" };
  }
  
  try {
    let apiEndpoint;
    let results;
    
    switch (mediaType) {
      case 'tv':
        apiEndpoint = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(cleanedTerm)}&include_adult=false&language=en-US&page=1`;
        break;
      case 'person':
        apiEndpoint = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(cleanedTerm)}&include_adult=false&language=en-US&page=1`;
        break;
      case 'movie':
      default:
        apiEndpoint = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanedTerm)}&include_adult=false&language=en-US&page=1`;
        break;
    }
    
    const response = await fetchFromTMDB(apiEndpoint);
    results = response.results;
    
    // Add to search history if there are results and user is logged in
    if (results.length > 0 && user) {
      const firstResult = results[0];
      try {
        await User.findByIdAndUpdate(user._id, {
          $push: {
            searchHistory: {
              id: firstResult.id,
              image: mediaType === 'person' ? firstResult.profile_path : firstResult.poster_path,
              title: firstResult.title || firstResult.name,
              searchType: mediaType,
              createdAt: new Date(),
            },
          },
        });
      } catch (err) {
        console.error('Error updating search history:', err);
      }
    }
    
    return {
      results: results,
      searchTerm: cleanedTerm,
      mediaType: mediaType,
      message: `Found ${results.length} results for "${cleanedTerm}"`
    };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(`Failed to search for "${cleanedTerm}"`);
  }
}

export default { processVoiceCommand };