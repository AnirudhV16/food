// backend/server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Import routes
const analyzeRoutes = require('./routes/analyze');
const recipeRoutes = require('./routes/recipe');
const ratingRoutes = require('./routes/rating');

const app = express();

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.warn('⚠️  Firebase Admin not initialized - serviceAccountKey.json not found');
  console.warn('   Notification features will not work');
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/rating', ratingRoutes);

// Notification endpoint
app.post('/api/notification/send', async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(500).json({ 
        error: 'Firebase Admin not initialized',
        message: 'serviceAccountKey.json is required for notifications'
      });
    }

    const { token, title, body, data } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const message = {
      notification: {
        title: title || 'Food Tracker Notification',
        body: body || 'You have a new notification'
      },
      data: data || {},
      token: token
    };

    const response = await admin.messaging().send(message);
    
    res.json({ 
      success: true, 
      messageId: response,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send notification', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀========================================🚀');
  console.log(`   Backend server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log('   CORS enabled for:', allowedOrigins.join(', '));
  console.log('🚀========================================🚀');
});