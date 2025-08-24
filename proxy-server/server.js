const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const multer = require('multer');
const FormData = require('form-data'); // Import form-data

dotenv.config();

const app = express();
const port = 3001; // no conflict with react app

app.use(cors());

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

const humekaUrl = process.env.humekaUrl; 
console.log("humekaUrl: ", humekaUrl);

// Update the route to accept file uploads
app.post('/proxy-to-humeka', upload.single('file'), async (req, res) => {
  console.log("Received file:", req.file); // Log the uploaded file information

  try {
   
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    }); // Append the file buffer and name

    // Send the file to humekaUrl
    const response = await axios.post(humekaUrl, formData, {
      headers: {
        ...formData.getHeaders(), // Set appropriate headers for FormData
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => {
});