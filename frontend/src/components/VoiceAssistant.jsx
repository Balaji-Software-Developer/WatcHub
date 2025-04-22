import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  const recognitionRef = useRef(null);

  // Send voice command to backend for processing
  const processVoiceCommand = useCallback(async (transcript) => {
    if (!transcript.trim()) return;
    
    try {
      console.log("Sending to backend:", transcript);
      
      // Add this line to automatically fill the search box
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) searchInput.value = transcript;
      
      // Send the transcript to your backend API
      const response = await axios.post('/api/v1/voice/voice-command', { 
        command: transcript
      });
      
      // Show success message
      setSuccessMessage('Voice command processed successfully');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear after 3 seconds
      
      // Handle the response from the backend
      const { success, _result, action } = response.data;
      
      if (success) {
        // If it's a search action, perform search
        if (action?.type === 'SEARCH' || transcript.toLowerCase().includes('search') || 
            !action || action.type === 'UNKNOWN') {
          // Trigger search API directly
          try {
            const searchResponse = await axios.get(`/api/v1/search/movie?query=${encodeURIComponent(transcript)}`);
            if (searchResponse.data?.results?.length > 0) {
              setMovieResults(searchResponse.data.results);
              setShowResults(true);
            } else {
              setErrorMsg("No movies found. Please try again.");
            }
          } catch (searchError) {
            console.error('Error searching for movies:', searchError);
            setErrorMsg("Error searching for movies. Please try again.");
          }
        } else if (action?.type === 'PLAYBACK') {
          // Handle playback commands if needed
          console.log("Playback command received:", action.action);
        }
      } else {
        setErrorMsg(response.data.message || "No movies found. Please try again.");
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setErrorMsg("Error processing request. Please try again.");
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMsg('Speech recognition not supported in this browser');
      return;
    }

    // Create recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure recognition
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    
    // Set up event handlers
    recognitionRef.current.onresult = (event) => {
      if (event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized text:", transcript);
        setSpeechText(transcript);
        processVoiceCommand(transcript);
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setErrorMsg(`Error: ${event.error}`);
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [processVoiceCommand]);

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechText('');
      setErrorMsg('');
      setSuccessMessage('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        console.log("Speech recognition started");
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        setErrorMsg(`Failed to start: ${err.message}`);
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleListening}
        className={`flex items-center justify-center p-3 rounded-full ${isListening ? 'bg-red-600' : 'bg-blue-600'} text-white`}
        aria-label="Voice Search"
        title="Search by voice"
      >
        {isListening ? (
          <span className="w-6 h-6 relative">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {/* Transcription display */}
      {speechText && (
        <div className="absolute top-12 right-0 mt-2 p-2 bg-gray-800 rounded text-white min-w-44 z-50">
          "{speechText}"
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className="absolute top-12 right-0 mt-2 p-2 bg-green-800 rounded text-white min-w-44 z-50">
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {errorMsg && (
        <div className="absolute top-12 right-0 mt-2 p-2 bg-red-800 rounded text-white min-w-44 z-50">
          {errorMsg}
        </div>
      )}
      
      {/* Search Results Display */}
      {showResults && movieResults.length > 0 && (
        <div className="absolute top-16 right-0 w-64 md:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Search Results</h3>
            <button 
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <ul>
            {movieResults.map((movie) => (
              <li key={movie.id} className="border-b border-gray-700 last:border-b-0">
                <button
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="flex items-center p-3 w-full text-left hover:bg-gray-800"
                >
                  <div className="w-12 h-16 flex-shrink-0 mr-3 bg-gray-700 rounded overflow-hidden">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                        alt={movie.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{movie.title}</h4>
                    {movie.release_date && (
                      <p className="text-gray-400 text-sm">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;