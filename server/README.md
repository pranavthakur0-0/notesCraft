# NoteCraft API Server

This is the backend server for NoteCraft, built with Express.js, TypeScript, and MongoDB.

## Structure

```
server/
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middlewares
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── index.ts           # Entry point
├── logs/                  # Application logs
├── .env                   # Environment variables (create from .env.example)
└── README.md              # This file
```

## Features

- RESTful API with Express.js
- TypeScript for type safety
- MongoDB with Mongoose for data storage
- JWT-based authentication
- Error handling middleware
- Request validation
- Rate limiting
- Security headers with Helmet
- CORS configuration
- Compression for API responses
- Detailed logging with Winston

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or remote)

### Installation

1. Copy `.env.example` to `.env` and update the values

```bash
cp .env.example .env
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run start:server
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/update-password` - Update password

### Notes

- `GET /api/v1/notes` - Get all notes
- `POST /api/v1/notes` - Create a new note
- `GET /api/v1/notes/:id` - Get a single note
- `PATCH /api/v1/notes/:id` - Update a note
- `DELETE /api/v1/notes/:id` - Delete a note

## Development

### Running with Hot Reload

```bash
npm run start:server
```

### Production Build

```bash
npm run build
```

## Environment Variables

See `.env.example` for the list of environment variables used by the application. 
