const { readUsers } = require('../utils/fileOperations');

// Basic authentication middleware
const authenticate = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Attach user data to request for use in next middleware/route handler
  req.user = user;
  next();
};

// Check if user is logged in
const isAuthenticated = (req, res, next) => {
  // In a real app, you would verify a JWT or session
  // For this simple implementation, we'll check if the user ID is in the request headers
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const users = readUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = user;
  next();
};

// Check if user is a book owner
const isBookOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Only book owners can perform this action.' });
  }
  next();
};

module.exports = {
  authenticate,
  isAuthenticated,
  isBookOwner
};