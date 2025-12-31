import express from 'express';
import morgan from 'morgan';
import expressRateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Global rate limiting middleware
const limiter = expressRateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 200, // limit each IP to 200 requests per windowMs
   message: {
      status: 429,
      message: 'Too many requests, please try again later.',
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Security middleware
app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
         },
      },
      crossOriginEmbedderPolicy: false,
   })
);

// Sanitize user input to prevent NoSQL injection
app.use(ExpressMongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev'));
} else {
   app.use(morgan('combined'));
}

// CORS configuration - allow everything in development for easier local testing
const isDev = process.env.NODE_ENV === 'development';

app.use(
   cors({
      origin: isDev
         ? (origin, callback) => callback(null, true) // unrestricted in development
         : function (origin, callback) {
            const allowedOrigins = [
               process.env.CLIENT_URL || 'http://localhost:5173',
            ];

            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) {
               return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
               callback(null, origin);
            } else {
               callback(new Error('Not allowed by CORS'));
            }
         },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
         'Content-Type',
         'Authorization',
         'X-Requested-With',
         'device-remember-token',
         'Access-Control-Allow-Origin',
         'Origin',
         'Accept',
      ],
      exposedHeaders: ['X-Content-Type-Options', 'Connection', 'Keep-Alive'],
      maxAge: 86400, // 24 hours - cache preflight requests
   })
);

// Body parser middleware
app.use(
   express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
         req.rawBody = buf;
      },
   })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((err, req, res, next) => {
   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
         success: false,
         message: 'Invalid JSON format in request body',
         error:
            process.env.NODE_ENV === 'development' ? err.message : 'Malformed JSON',
      });
   }
   next(err);
});

// Cookie parser middleware
app.use(cookieParser());

// Apply rate limiting to API routes
app.use('/api', limiter);

// Root endpoint
app.get('/api', (req, res) => {
   res.status(200).json({
      status: 'OK',
      message: 'API is running',
   });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
   res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
   });
});

// Import routes
import userRoutes from './routes/userRoutes.js';
import classRoutes from './routes/classRoutes.js';

// API routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);

// Welcome route
app.use('/', (req, res) => {
   res.status(200).json({
      status: 'OK',
      message: 'Welcome to the API',
   });
});


// Global error handler
app.use((err, req, res,
   next) => {
   // Handle timeout errors
   if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      return res.status(504).json({
         success: false,
         status: 504,
         message: 'Request timeout',
         details:
            'The server took too long to process your request. Please try again.',
         code: 'REQUEST_TIMEOUT',
      });
   }

   // Handle payload too large error
   if (err.type === 'entity.too.large' || err.status === 413) {
      return res.status(413).json({
         success: false,
         status: 413,
         message: 'Content size exceeds the maximum allowed limit',
         details: 'Please reduce content size. Maximum allowed: 10MB',
      });
   }

   // Handle specific error types
   if (err.name === 'ValidationError') {
      return res.status(400).json({
         status: 400,
         message: 'Validation Error',
         errors: Object.values(err.errors).map((e) => e.message),
      });
   }

   if (err.name === 'CastError') {
      return res.status(400).json({
         status: 400,
         message: 'Invalid ID format',
      });
   }

   if (err.code === 11000) {
      return res.status(409).json({
         status: 409,
         message: 'Duplicate field value',
      });
   }

   // Default error response
   res.status(err.status || 500).json({
      status: err.status || 500,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
   });
});

// 404 handler - always at the end
app.use((req, res) => {
   res.status(404).json({
      status: 404,
      message: `Route ${req.originalUrl} not found`,
   });
});

// Start server
const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
   try {
      // Connect to MongoDB
      await connectDB();

      // Start Express server
      app.listen(PORT, () => {
         console.log(`🚀 Server is running on port ${PORT}`);
         console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
   } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
   }
};

startServer();

export default app;