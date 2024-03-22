const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

// Serve static files from the 'front' directory
app.use(express.static(path.join(__dirname, 'front')));

// Route to handle fetching citizen data
app.get('/citizen/:address', async (req, res) => {
    try {
        // Extract citizen address from request parameters
        const citizenAddress = req.params.address;

        // Simulated API endpoint for fetching citizen data
        const apiUrl = `https://api.example.com/citizen/${citizenAddress}`;

        // Execute the API request
        const apiResponse = await fetch(apiUrl);
        const jsonData = await apiResponse.json();

        // Check for errors in API response
        if (!apiResponse.ok) {
            throw new Error('Request failed');
        }

        // Return the citizen data as JSON response
        res.json(jsonData);
    } catch (error) {
        // Handle errors
        console.error('Error fetching citizen data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve the index.html file
app.get('/', (req, res) => {
    // This will still serve your index.html file, but now other static files are served too
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});