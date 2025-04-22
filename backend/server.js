import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import morgan from "morgan";
import helmet from "helmet";

// Import routes
import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";
import downloadRoutes from './routes/downloadRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// Import middleware and config
import { ENV_VARS } from './config/envVars.js';
import { connectDB } from './config/db.js';
import { protectRoute } from "./middleware/protectRoute.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Setup __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express application
const app = express();
const PORT = ENV_VARS.PORT || 5000;

// Essential Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false })); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5000"], 
  credentials: true 
}));

// Create necessary directories if they don't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  console.log(`Creating downloads directory: ${downloadsDir}`);
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Setup global download progress tracking
global.downloadProgress = {};

// Static folder for downloads - protected by authentication
app.use('/downloads', protectRoute, express.static(path.join(__dirname, 'downloads')));

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/movie", protectRoute, movieRoutes);
app.use("/api/v1/tv", protectRoute, tvRoutes);
app.use("/api/v1/search", protectRoute, searchRoutes);
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/voice', voiceRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend for production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Check for required environment variables
const checkEnvironmentVariables = () => {
  const requiredVars = [
    'TMDB_API_KEY',
    'TMDB_READ_ACCESS_TOKEN',
    'JWT_SECRET',
    'YOUTUBE_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !ENV_VARS[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    console.warn('Some features may not work correctly.');
  } else {
    console.log('✅ All required environment variables are set.');
    console.log(`📁 Download files will be saved to: ${process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'downloads')}`);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Start express server
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`📁 Download files will be saved to: ${downloadsDir}`);
      checkEnvironmentVariables();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled promises
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Clean up function for graceful shutdown
const cleanup = () => {
  console.log('🛑 Shutting down server...');
  // Perform any cleanup operations here (close database, clear temporary files, etc.)
  process.exit(0);
};

// Handle termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
startServer();

export default app;