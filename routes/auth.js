const express = require('express');
const router = express.Router();
const { readUsers, writeUsers } = require('../utils/fileOperations');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Register a new user
router.post('/register', (req, res) => {
  const { name, mobile, email, password, role } = req.body;

  // Basic validation
  if (!name || !mobile || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (role !== 'owner' && role !== 'seeker') {
    return res.status(400).json({ message: "Role must be either 'owner' or 'seeker'" });
  }

  const users = readUsers();

  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    name,
    mobile,
    email,
    password, // In a real app, you would hash this
    role,
    createdAt: new Date().toISOString()
  };

  // Save to file
  users.push(newUser);
  if (writeUsers(users)) {
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } else {
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Return user data (excluding password)
  const { password: userPassword, ...userWithoutPassword } = user;
  return res.status(200).json({ 
    message: 'Login successful', 
    user: userWithoutPassword 
  });
});

// Get user profile (protected route)
router.get('/profile', (req, res) => {
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const users = readUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Return user data (excluding password)
  const { password, ...userWithoutPassword } = user;
  return res.status(200).json(userWithoutPassword);
});

module.exports = router;