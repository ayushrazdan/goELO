import { Router } from 'express';
import { signup, login } from '../controllers/userController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

import { authenticateJWT } from '../middleware/auth';

router.get('/profile', authenticateJWT, (req, res) => {
  // Protected route logic here
  res.json({ message: 'This is a protected route', user: (req as any).user });
});

router.get('/session',authenticateJWT, (req, res) => {
  const username1 = (req.session as any).username1; // Fetch username1 from session
  if (username1) {
    res.json({ username1 });
  } else {
    res.status(404).json({ message: 'User not logged in' });
  }
});
export default router;
