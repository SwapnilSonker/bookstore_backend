const fs = require('fs');
const path = require('path');

// File paths
const usersFilePath = path.join(__dirname, '../data/users.json');
const booksFilePath = path.join(__dirname, '../data/books.json');

// Read users data
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data).users;
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Write users data
const writeUsers = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// Read books data
const readBooks = () => {
  try {
    const data = fs.readFileSync(booksFilePath, 'utf8');
    return JSON.parse(data).books;
  } catch (error) {
    console.error('Error reading books file:', error);
    return [];
  }
};

// Write books data
const writeBooks = (books) => {
  try {
    fs.writeFileSync(booksFilePath, JSON.stringify({ books }, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing books file:', error);
    return false;
  }
};

module.exports = {
  readUsers,
  writeUsers,
  readBooks,
  writeBooks
};