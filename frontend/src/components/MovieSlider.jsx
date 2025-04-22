import { useEffect, useRef, useState } from "react";
import { useContentStore } from "../store/content";
import axios from "axios";
import { Link } from "react-router-dom";
import { SMALL_IMG_BASE_URL } from "../utils/constants";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

const MovieSlider = ({ category }) => {
	const { contentType } = useContentStore();
	const [content, setContent] = useState([]);
	const [showArrows, setShowArrows] = useState(false);
	const [downloading, setDownloading] = useState({});

	const sliderRef = useRef(null);

	const formattedCategoryName =
		category.replaceAll("_", " ")[0].toUpperCase() + category.replaceAll("_", " ").slice(1);
	const formattedContentType = contentType === "movie" ? "Movies" : "TV Shows";

	useEffect(() => {
		const getContent = async () => {
			const res = await axios.get(`/api/v1/${contentType}/${category}`);
			setContent(res.data.content);
		};

		getContent();
	}, [contentType, category]);

	const scrollLeft = () => {
		if (sliderRef.current) {
			sliderRef.current.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: "smooth" });
		}
	};
	
	const scrollRight = () => {
		sliderRef.current.scrollBy({ left: sliderRef.current.offsetWidth, behavior: "smooth" });
	};

	const handleDownload = async (e, item) => {
		e.preventDefault(); // Prevent navigation
		e.stopPropagation(); // Prevent event bubbling
		
		try {
			setDownloading(prev => ({ ...prev, [item.id]: true }));
			
			const response = await axios.get(`/api/v1/download/${contentType}/${item.id}`, {
				responseType: 'blob',
			});
			
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			const title = item.title || item.name;
			const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
			
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Download failed:', error);
			alert('Download failed. Please try again later.');
		} finally {
			setDownloading(prev => ({ ...prev, [item.id]: false }));
		}
	};

	return (
		<div
			className='bg-black text-white relative px-5 md:px-20'
			onMouseEnter={() => setShowArrows(true)}
			onMouseLeave={() => setShowArrows(false)}
		>
			<h2 className='mb-4 text-2xl font-bold'>
				{formattedCategoryName} {formattedContentType}
			</h2>

			<div className='flex space-x-4 overflow-x-scroll scrollbar-hide' ref={sliderRef}>
				{content.map((item) => (
					<div className='min-w-[250px] relative group' key={item.id}>
						<Link to={`/watch/${item.id}`} className='block'>
							<div className='rounded-lg overflow-hidden'>
								<img
									src={SMALL_IMG_BASE_URL + item.backdrop_path}
									alt='Movie image'
									className='transition-transform duration-300 ease-in-out group-hover:scale-125'
								/>
							</div>
							<p className='mt-2 text-center'>{item.title || item.name}</p>
						</Link>
						
						{/* Download Button */}
						<button 
							onClick={(e) => handleDownload(e, item)}
							disabled={downloading[item.id]}
							className='absolute bottom-10 right-2 bg-black bg-opacity-70 hover:bg-opacity-90 
								text-white rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100'
							title="Download"
						>
							<Download size={18} className={downloading[item.id] ? 'animate-pulse' : ''} />
						</button>
					</div>
				))}
			</div>

			{showArrows && (
				<>
					<button
						className='absolute top-1/2 -translate-y-1/2 left-5 md:left-24 flex items-center justify-center
            size-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 text-white z-10
            '
						onClick={scrollLeft}
					>
						<ChevronLeft size={24} />
					</button>

					<button
						className='absolute top-1/2 -translate-y-1/2 right-5 md:right-24 flex items-center justify-center
            size-12 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 text-white z-10
            '
						onClick={scrollRight}
					>
						<ChevronRight size={24} />
					</button>
				</>
			)}
		</div>
	);
};
export default MovieSlider;