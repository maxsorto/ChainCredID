const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the 'front' directory
app.use(express.static(path.join(__dirname, 'front')));

app.get('/', (req, res) => {
    // This will still serve your index.html file, but now other static files are served too
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
