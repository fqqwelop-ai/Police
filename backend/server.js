require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { startBot } = require('./bot/client');

const authRoutes = require('./routes/auth');
const officerRoutes = require('./routes/officers');
const rankRoutes = require('./routes/ranks');
const reportRoutes = require('./routes/reports');
const requestRoutes = require('./routes/requests');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => res.json({ status: 'running', service: 'police-system' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚓 السيرفر يعمل على المنفذ ${PORT}`));
  startBot();
});
