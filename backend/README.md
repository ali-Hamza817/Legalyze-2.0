# Legalyze Backend - Authentication API

## Overview
Secure authentication backend for the Legalyzing application built with Node.js, Express, MongoDB Atlas, and JWT.

## Features
- ✅ JWT-based authentication
- ✅ Bcrypt password hashing (12 salt rounds)
- ✅ MongoDB Atlas integration
- ✅ Rate limiting for security
- ✅ Input validation
- ✅ CORS enabled
- ✅ Comprehensive error handling

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **SECURITY**: Never commit real credentials. Use `.env.example` as a template and always use environment-specific credentials.

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Seed Database with Test Users
```bash
npm run seed
```

## Test Credentials

| Email | Password |
|-------|----------|
| admin@legalyze.com | Admin@123 |
| john.doe@legalyze.com | John@123 |
| jane.smith@legalyze.com | Jane@123 |

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@legalyze.com",
  "password": "Admin@123"
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Logout (Protected)
```
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Tokens**: 7-day expiration
- **Rate Limiting**: 
  - General API: 100 requests/15min
  - Auth endpoints: 10 requests/15min
- **Input Validation**: Email format, password strength
- **CORS**: Restricted to frontend origin

## Project Structure

```
backend/
├── server.js              # Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── config/
│   └── db.js             # MongoDB connection
├── models/
│   └── User.js           # User schema
├── routes/
│   └── auth.js           # Authentication routes
├── middleware/
│   └── auth.js           # JWT verification
└── scripts/
    └── seedUsers.js      # Database seeding
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT generation/verification
- **dotenv**: Environment variables
- **cors**: CORS middleware
- **express-validator**: Input validation
- **express-rate-limit**: Rate limiting

## License
MIT
