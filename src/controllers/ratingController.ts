import { Request, Response } from 'express';
import pool from '../models/db';
import { execFile } from 'child_process';
import path from 'path';

export const updateRatings = async (req: Request, res: Response) => {
  const { username1, username2, winner } = req.body;
  const numWinner = Number(winner);
  if (!username1 || !username2 || isNaN(numWinner)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    // Fetch ratings for both players
    const [player1Data]: any = await pool.query('SELECT rating FROM users WHERE username = ?', [username1]);
    const [player2Data]: any = await pool.query('SELECT rating FROM users WHERE username = ?', [username2]);

    if (player1Data.length === 0 || player2Data.length === 0) {
      return res.status(404).json({ message: 'One or both players not found' });
    }

    const player1Rating = player1Data[0].rating;
    const player2Rating = player2Data[0].rating;

    // Path to the C++ binary
    const binaryPath = path.resolve(__dirname, '../bin/elo_calculator.exe');

    // Call the C++ binary with necessary arguments
    // -1 for p1 win, 0 for draw, 1 for p2 win

    const K = 32;

    execFile(binaryPath, [player1Rating, player2Rating, numWinner.toString(), K.toString()], (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Error calling the ELO calculator: ${stderr}`);
        return res.status(500).json({ message: 'Error calculating ELO rating ' + stderr });
      }

      const ratingChange = parseFloat(stdout.trim());
      const newPlayer1Rating = Math.max(1, player1Rating + ratingChange);
      const newPlayer2Rating = Math.max(1, player2Rating - ratingChange);

      pool.query('UPDATE users SET rating = ? WHERE username = ?', [newPlayer1Rating, username1]);
      pool.query('UPDATE users SET rating = ? WHERE username = ?', [newPlayer2Rating, username2]);

      // Success response
      res.status(200).json({
        message: 'Ratings updated successfully',
        player1: { username: username1, rating: newPlayer1Rating },
        player2: { username: username2, rating: newPlayer2Rating }
      });
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
