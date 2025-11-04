// backend/server.js - Updated to use environment variables
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Import routes
const analyzeRoutes = require('./routes/analyze');
const recipeRoutes = require('./routes/recipe');
const ratingRoutes = require('./routes/rating');

const app = express();

// Initialize Firebase Admin using environment variables
try {
  // Validate required environment variables
  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_PRIVATE_KEY || 
      !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing required Firebase environment variables');
  }

  // Create service account object from environment variables
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized from environment variables');
  console.log('   Project ID:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  console.warn('   Notification features will not work');
  console.warn('   Please check your Firebase environment variables in .env file');
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

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
    timestamp: new Date().toISOString(),
    firebase: admin.apps.length > 0 ? 'initialized' : 'not initialized',
    visionAPI: process.env.GOOGLE_CLOUD_PROJECT_ID ? 'configured' : 'not configured'
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
        message: 'Firebase environment variables are required for notifications'
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
  console.log('   Environment: ', process.env.NODE_ENV || 'development');
  console.log('🚀========================================🚀');
});