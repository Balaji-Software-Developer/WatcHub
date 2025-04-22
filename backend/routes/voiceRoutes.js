// backend/routes/voiceRoutes.js
import express from 'express';
import * as voiceController from '../controllers/voiceCommandController.js';

const router = express.Router();

// POST route to process voice commands
router.post('/voice-command', voiceController.processVoiceCommand);

export default router;