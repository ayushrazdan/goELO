import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';  
import userRoutes from './routes/userRoutes';
import ratingRoutes from './routes/ratingRoutes';
import path from 'path';
import session from 'express-session';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be defined in the environment variables');
}


// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5500',  // Change this to your frontend URL
  credentials: true  // Enable sending cookies
}));

app.use(express.json());
app.use(cookieParser());  // Enable cookie parsing

// Session configuration
app.use(session({
  secret: sessionSecret,  // Use a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  // Set this to true in production with HTTPS
    httpOnly: true
  }
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRoutes);
app.use('/api/rating', ratingRoutes);

// Serve the login/signup page for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
