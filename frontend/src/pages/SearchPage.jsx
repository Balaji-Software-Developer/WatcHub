// Frontend/src/pages/SearchPage.jsx
import { useState } from "react";
import { useContentStore } from "../store/content";
import Navbar from "../components/Navbar";
import VoiceSearch from "../components/VoiceSearch";

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState("movie");
  const { setContentType } = useContentStore();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "movie" || tab === "tv") {
      setContentType(tab);
    }
  };

  return (
    <div className='bg-black min-h-screen text-white'>
      <Navbar />
      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-center gap-3 mb-4'>
          <button
            className={`py-2 px-4 rounded ${
              activeTab === "movie" ? "bg-red-600" : "bg-gray-800"
            } hover:bg-red-700`}
            onClick={() => handleTabClick("movie")}
          >
            Movies
          </button>
          <button
            className={`py-2 px-4 rounded ${
              activeTab === "tv" ? "bg-red-600" : "bg-gray-800"
            } hover:bg-red-700`}
            onClick={() => handleTabClick("tv")}
          >
            TV Shows
          </button>
          <button
            className={`py-2 px-4 rounded ${
              activeTab === "person" ? "bg-red-600" : "bg-gray-800"
            } hover:bg-red-700`}
            onClick={() => handleTabClick("person")}
          >
            Person
          </button>
        </div>

        {/* Voice search component */}
        <VoiceSearch activeTab={activeTab} />
      </div>
    </div>
  );
};

export default SearchPage;