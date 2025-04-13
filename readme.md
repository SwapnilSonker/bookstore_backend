# Bookstore API

A RESTful API for managing a bookstore application.

## Features

- User authentication (register, login)
- Book management (CRUD operations)
- Book search and filtering

## Technologies

- Node.js
- Express
- MongoDB
- JWT Authentication

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bookstore
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `npm start`
5. For development: `npm run dev`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token

### Books

- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create a new book (requires auth)
- `PUT /api/books/:id` - Update a book (requires auth)
- `DELETE /api/books/:id` - Delete a book (requires auth)

## Error Handling

The API returns appropriate status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Testing

Run tests with `npm test`