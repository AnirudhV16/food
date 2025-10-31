// backend/routes/analyze.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const vision = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Vision API client with API key
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: undefined,
  apiKey: process.env.GOOGLE_VISION_API_KEY
});

// POST /api/analyze - Analyze product images
router.post('/', upload.array('images', 4), async (req, res) => {
  try {
    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No images provided',
        message: 'Please upload at least one image'
      });
    }

    console.log(`📸 Analyzing ${req.files.length} image(s)...`);

    const allText = [];
    const imageAnalysis = [];

    // Process each image with Vision API
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`   Processing image ${i + 1}/${req.files.length}...`);

      try {
        // Call Vision API for text detection
        const [result] = await visionClient.textDetection({
          image: { content: file.buffer }
        });
        
        const detections = result.textAnnotations;
        
        if (detections && detections.length > 0) {
          const extractedText = detections[0].description;
          allText.push(extractedText);
          
          imageAnalysis.push({
            imageIndex: i,
            textFound: true,
            textLength: extractedText.length,
            preview: extractedText.substring(0, 100) + '...'
          });
          
          console.log(`   ✓ Image ${i + 1}: Found ${extractedText.length} characters`);
        } else {
          imageAnalysis.push({
            imageIndex: i,
            textFound: false,
            message: 'No text detected in this image'
          });
          console.log(`   ⚠ Image ${i + 1}: No text detected`);
        }
      } catch (visionError) {
        console.error(`   ✗ Image ${i + 1} Vision API error:`, visionError.message);
        imageAnalysis.push({
          imageIndex: i,
          textFound: false,
          error: visionError.message
        });
      }
    }

    // Combine all extracted text
    const combinedText = allText.join('\n\n');

    if (!combinedText.trim()) {
      return res.status(400).json({
        error: 'No text found in images',
        message: 'Please ensure images contain clear, readable text',
        imageAnalysis: imageAnalysis
      });
    }

    console.log('🤖 Sending to Gemini AI for structured extraction...');

    // Use Gemini to extract structured data
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a food product label analyzer. Analyze the following text extracted from product labels and return a JSON object.

Extract:
1. Product Name - the main product name
2. Manufacturing Date - in YYYY-MM-DD format (look for "Mfg", "Manufacturing", "Made on", etc.)
3. Expiry Date - in YYYY-MM-DD format (look for "Exp", "Expiry", "Best before", "Use by", etc.)
4. Ingredients - array of individual ingredients
5. Nutritional Information - object with nutrients found

Text from labels:
${combinedText}

Rules:
- If a date is in DD/MM/YYYY or MM/DD/YYYY format, convert to YYYY-MM-DD
- If only month/year is given, use first day of month
- If no date found, use null
- Extract ALL ingredients mentioned
- Be smart about date formats (e.g., "Dec 2025" = "2025-12-01")

Return ONLY valid JSON with this exact structure:
{
  "productName": "string or null",
  "mfgDate": "YYYY-MM-DD or null",
  "expDate": "YYYY-MM-DD or null",
  "ingredients": ["ingredient1", "ingredient2"] or [],
  "nutrition": {
    "calories": "value",
    "protein": "value",
    "carbs": "value"
  } or {}
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let productData;
    try {
      productData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback to basic data
      productData = {
        productName: "Unknown Product",
        mfgDate: null,
        expDate: null,
        ingredients: [],
        nutrition: {}
      };
    }

    console.log('✅ Analysis complete!');

    res.json({
      success: true,
      data: productData,
      metadata: {
        imagesProcessed: req.files.length,
        textExtracted: combinedText.length,
        imageAnalysis: imageAnalysis
      },
      rawText: combinedText.substring(0, 500) + '...' // First 500 chars for reference
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze images', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;