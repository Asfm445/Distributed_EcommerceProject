# User Service

The User Service manages user accounts, authentication, and profiles.

## Technology Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Security**: JWT, Bcrypt

## Features

- User registration and login
- JWT-based authentication
- Profile management
- Admin role management

## Getting Started

### Prerequisites

- Node.js (v20+)
- MongoDB

### Environment Variables

```env
PORT=8002
MONGO_URI=mongodb://localhost:27017/user_db
JWT_SECRET=your_jwt_secret
```

### Installation & Run

```bash
npm install
npm run dev
```
