const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

const iclockRoutes = require('./src/routes/iclock');
const adminRoutes = require('./src/routes/admin');

// The Asensio devices send plain text, we need a custom parser for the /iclock routes
app.use('/iclock', express.text({ type: '*/*' }));
app.use('/iclock', iclockRoutes);

app.use(express.static('public')); // Serve dashboard files

app.use(express.json()); // For the admin panel API
app.use('/api/admin', adminRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Asensio Sistemas S.A. Proyect ADMS Server Running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
