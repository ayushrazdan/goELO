import { Request, Response } from 'express';
import pool from '../models/db';
import { hashPassword, comparePassword } from '../utils/hash';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';  // Fallback if env variable is missing
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';     // Default to 1 hour expiration

export const signup = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email || null]
    );

    res.status(201).json({ message: 'User created', userId: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },  // Payload
      JWT_SECRET,  // Secret key
      { expiresIn: JWT_EXPIRATION }  // Token expiration
    );

     // Set JWT as an HTTP-only cookie
     res.cookie('jwt', token, {
      httpOnly: true,    // Ensure the cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 3600000,   // Cookie expiration in milliseconds (e.g., 1 hour)
    }); // Send JWT in response
    (req.session as any).username1 = username;      
    res.status(200).json({ message: 'Login Successful'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
