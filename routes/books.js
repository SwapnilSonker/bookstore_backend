const express = require('express');
const router = express.Router();
const { readBooks, writeBooks, readUsers } = require('../utils/fileOperations');
const { isAuthenticated, isBookOwner } = require('../middleware/auth');
const { upload } = require('../utils/imageUpload');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Get all books
router.get('/', (req, res) => {
  const books = readBooks();
  res.status(200).json(books);
});

// Get a specific book by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const books = readBooks();
  const book = books.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  
  res.status(200).json(book);
});

// Create a new book listing (only for book owners)
router.post('/', isAuthenticated, isBookOwner, upload.single('coverImage'), (req, res) => {
  const { title, author, genre, location, contactInfo } = req.body;
  const ownerId = req.user.id;
  
  // Basic validation
  if (!title || !author || !location) {
    // If an image was uploaded but validation failed, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'Title, author, and location are required' });
  }
  
  const books = readBooks();
  const users = readUsers();
  const owner = users.find(u => u.id === ownerId);
  
  // Handle cover image if uploaded
  let coverImageUrl = null;
  if (req.file) {
    // Generate URL path for the uploaded image
    coverImageUrl = `/uploads/${req.file.filename}`;
  }
  
  // Create new book listing
  const newBook = {
    id: uuidv4(),
    title,
    author,
    genre: genre || 'Not specified',
    location,
    contactInfo: contactInfo || owner.email || owner.mobile,
    ownerId,
    ownerName: owner.name,
    coverImageUrl,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to file
  books.push(newBook);
  if (writeBooks(books)) {
    return res.status(201).json({ message: 'Book listed successfully', book: newBook });
  } else {
    // If saving to JSON failed, remove the uploaded image
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: 'Failed to list book' });
  }
});

// Update a book listing (only the owner can update their own book)
router.put('/:id', isAuthenticated, upload.single('coverImage'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, author, genre, location, contactInfo, isAvailable } = req.body;
  
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    // Remove uploaded file if book doesn't exist
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // Check if the user is the owner of the book
  if (books[bookIndex].ownerId !== userId) {
    // Remove uploaded file if user isn't authorized
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(403).json({ message: 'You can only update your own book listings' });
  }
  
  // Handle cover image if a new one was uploaded
  let coverImageUrl = books[bookIndex].coverImageUrl;
  if (req.file) {
    // Remove old image if it exists
    if (books[bookIndex].coverImageUrl) {
      const oldImagePath = path.join(__dirname, '../public', books[bookIndex].coverImageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Set new image URL
    coverImageUrl = `/uploads/${req.file.filename}`;
  }
  
  // Update book
  books[bookIndex] = {
    ...books[bookIndex],
    title: title || books[bookIndex].title,
    author: author || books[bookIndex].author,
    genre: genre || books[bookIndex].genre,
    location: location || books[bookIndex].location,
    contactInfo: contactInfo || books[bookIndex].contactInfo,
    coverImageUrl: coverImageUrl,
    isAvailable: isAvailable !== undefined ? isAvailable : books[bookIndex].isAvailable,
    updatedAt: new Date().toISOString()
  };
  
  if (writeBooks(books)) {
    return res.status(200).json({ message: 'Book updated successfully', book: books[bookIndex] });
  } else {
    // If saving to JSON failed, remove the uploaded image
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: 'Failed to update book' });
  }
});

// Delete a book listing (only the owner can delete their own book)
router.delete('/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // Check if the user is the owner of the book
  if (books[bookIndex].ownerId !== userId) {
    return res.status(403).json({ message: 'You can only delete your own book listings' });
  }
  
  // Remove the book cover image if it exists
  if (books[bookIndex].coverImageUrl) {
    const imagePath = path.join(__dirname, '../public', books[bookIndex].coverImageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  // Remove book from array
  const updatedBooks = books.filter(b => b.id !== id);
  
  if (writeBooks(updatedBooks)) {
    return res.status(200).json({ message: 'Book deleted successfully' });
  } else {
    return res.status(500).json({ message: 'Failed to delete book' });
  }
});

// Search books (by title, author, or location)
router.get('/search', (req, res) => {
  const { query, location, genre } = req.query;
  let books = readBooks();
  
  if (query) {
    const searchQuery = query.toLowerCase();
    books = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery) ||
      book.author.toLowerCase().includes(searchQuery)
    );
  }
  
  if (location) {
    const searchLocation = location.toLowerCase();
    books = books.filter(book => 
      book.location.toLowerCase().includes(searchLocation)
    );
  }
  
  if (genre) {
    const searchGenre = genre.toLowerCase();
    books = books.filter(book => 
      book.genre.toLowerCase().includes(searchGenre)
    );
  }
  
  res.status(200).json(books);
});

// Get books by owner ID
router.get('/owner/:ownerId', (req, res) => {
  const { ownerId } = req.params;
  const books = readBooks();
  
  const ownerBooks = books.filter(book => book.ownerId === ownerId);
  res.status(200).json(ownerBooks);
});

module.exports = router;