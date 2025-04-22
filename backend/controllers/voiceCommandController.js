// backend/controllers/voiceCommandController.js
import axios from 'axios';
import { searchMovies, searchTvShows, searchPerson } from './searchController.js';

// Process voice commands from the client
export const processVoiceCommand = async (req, res) => {
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
        result = await handleSearchCommand(action.term, action.mediaType || 'movie');
        break;
      case 'NAVIGATE':
        // Handle navigation command
        result = { 
          redirect: action.destination,
          message: `Navigating to ${action.destination}`
        };
        break;
      default:
        result = { message: "Command not recognized", originalCommand: command };
    }
    
    return res.status(200).json({
      success: true,
      message: 'Voice command processed successfully',
      result: result
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process voice command', 
      error: error.message 
    });
  }
};

// Helper function to determine the action based on the command
const determineAction = (command) => {
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
      destination = '/history';
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
};

// Helper function to extract search terms
const extractSearchTerm = (command) => {
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
};

// Handle search commands by type
const handleSearchCommand = async (searchTerm, mediaType) => {
  // Remove filler words from the search term
  const cleanedTerm = searchTerm
    .replace(/^(the|a|an) /i, '')
    .replace(/^for /i, '')
    .trim();
  
  if (!cleanedTerm) {
    return { results: [], message: "No search term provided" };
  }
  
  try {
    let results;
    
    switch (mediaType) {
      case 'tv':
        // Use your existing search TV shows function
        results = await searchTvShows(cleanedTerm);
        break;
      case 'person':
        // Use your existing search person function
        results = await searchPerson(cleanedTerm);
        break;
      case 'movie':
      default:
        // Use your existing search movies function
        results = await searchMovies(cleanedTerm);
        break;
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
};