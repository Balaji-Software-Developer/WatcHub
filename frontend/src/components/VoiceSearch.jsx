// Frontend/src/components/VoiceSearch.jsx
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Search } from "lucide-react";
import axios from "axios";
import { ORIGINAL_IMG_BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";
import { useContentStore } from "../store/content";
import toast from "react-hot-toast";

const VoiceSearch = ({ activeTab }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setContentType } = useContentStore();
  
  // Use useRef to persist the recognition instance between renders
  const recognitionRef = useRef(null);

  // Initialize speech recognition once
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast.success("Listening...");
      };
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // Search as user speaks if it's a final result
        if (event.results[current].isFinal) {
          handleSearch(transcriptText);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error("Voice recognition error. Please try again.");
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast.error("Your browser doesn't support speech recognition");
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping speech recognition:", err);
        }
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Clear previous results and transcript when starting a new session
      setResults([]);
      setTranscript("");
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        toast.error("Failed to start voice recognition. Please try again.");
        setIsListening(false);
      }
    }
  };
  
  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // First try direct search
      const res = await axios.get(`/api/v1/search/${activeTab}/${query}`);
      if (res.data.content && res.data.content.length > 0) {
        setResults(res.data.content);
      } else {
        // If no direct results, try processing as a voice command
        try {
          const commandRes = await axios.post('/api/v1/voice/voice-command', { 
            command: query
          });
          
          const { success, result } = commandRes.data;
          
          if (success && result && result.results && result.results.length > 0) {
            setResults(result.results);
          } else {
            toast.error("No results found. Try a different search term or category.");
          }
        } catch (commandErr) {
          console.error("Voice command processing error:", commandErr);
          toast.error("No results found. Try a different search term.");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      if (error.response?.status === 404) {
        toast.error("Nothing found, make sure you are searching under the right category");
      } else {
        toast.error("An error occurred, please try again later");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleManualSearch = (e) => {
    e.preventDefault();
    handleSearch(transcript);
  };
  
  return (
    <div className="voice-search-container">
      <div className="flex gap-2 items-stretch mb-8 max-w-2xl mx-auto">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={`Search for a ${activeTab}`}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        <button 
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
          onClick={handleManualSearch}
          disabled={isLoading}
        >
          <Search className="size-6" />
        </button>
        <button 
          className={`p-2 rounded ${isListening ? 'bg-red-500' : 'bg-gray-700'} hover:bg-red-600 relative`}
          onClick={toggleListening}
          disabled={isLoading}
        >
          {isListening ? (
            <>
              <MicOff className="size-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </>
          ) : (
            <Mic className="size-6" />
          )}
        </button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((result) => {
            // Skip items without images
            if (!result.poster_path && !result.profile_path) return null;

            return (
              <div key={result.id} className="bg-gray-800 p-4 rounded">
                {activeTab === "person" ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={ORIGINAL_IMG_BASE_URL + result.profile_path}
                      alt={result.name}
                      className="max-h-96 rounded mx-auto"
                    />
                    <h2 className="mt-2 text-xl font-bold">{result.name}</h2>
                  </div>
                ) : (
                  <Link
                    to={"/watch/" + result.id}
                    onClick={() => {
                      setContentType(activeTab);
                    }}
                  >
                    <img
                      src={ORIGINAL_IMG_BASE_URL + result.poster_path}
                      alt={result.title || result.name}
                      className="w-full h-auto rounded"
                    />
                    <h2 className="mt-2 text-xl font-bold">{result.title || result.name}</h2>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;