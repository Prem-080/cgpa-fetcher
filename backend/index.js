import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


console.log("______________________________________________________");

if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env.development' });
}

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim());

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
};

import fetchGradeRouter from './routes/fetchGrade.js';
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/v1/', fetchGradeRouter);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error',
    });
});



// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.1',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'CGPA Fetcher API - Stable & Fast',
        version: '2.1',
        endpoints: {
            '/fetch-grade': 'POST - Fetch student CGPA',
            '/health': 'GET - Health check'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Stable CGPA Fetcher running on port ${PORT}`);
    console.log('✅ Server ready - optimized for speed and stability');
    console.log(`📡 Health check available at: http://localhost:${PORT}/health`);
});