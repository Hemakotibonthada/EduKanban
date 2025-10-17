# Environment Setup Guide

This document explains how to set up the environment variables for the EduKanban project.

## Quick Setup

### 1. Backend Environment Setup

```bash
# Navigate to backend directory
cd backend

# Copy the example file
copy .env.example .env

# Edit the .env file with your specific values
```

### 2. Frontend Environment Setup

```bash
# Navigate to frontend directory
cd frontend

# Copy the example file
copy .env.example .env

# Edit the .env file with your specific values
```

## Required Environment Variables

### Backend (.env)

**CRITICAL - Must be changed for security:**
- `JWT_SECRET` - A secure random string for JWT token signing
- `SESSION_SECRET` - A secure random string for session management

**Database:**
- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/edukanban`)

**AI Features:**
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI features)

**Server Configuration:**
- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment mode (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend (.env)

**API Configuration:**
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5001/api)
- `VITE_SOCKET_URL` - WebSocket URL (default: http://localhost:5001)

**Feature Flags:**
- `VITE_ENABLE_AI_FEATURES` - Enable/disable AI features
- `VITE_ENABLE_CHAT` - Enable/disable chat functionality
- `VITE_ENABLE_NOTIFICATIONS` - Enable/disable notifications
- `VITE_ENABLE_GAMIFICATION` - Enable/disable gamification features
- `VITE_ENABLE_CERTIFICATES` - Enable/disable certificate system

## Security Notes

1. **Never commit .env files to git** - They are already in .gitignore
2. **Change default secrets** - Replace all default JWT_SECRET and SESSION_SECRET values
3. **Use strong secrets** - Generate random strings for production secrets
4. **Protect API keys** - Keep your OpenAI API key secure and private

## Generating Secure Secrets

For JWT_SECRET and SESSION_SECRET, use a secure random generator:

```javascript
// In Node.js console
require('crypto').randomBytes(64).toString('hex')
```

Or use online tools like:
- https://generate.plus/en/random-string
- Generate a 64-character random string

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production`
2. Update `MONGODB_URI` to your production database
3. Update `FRONTEND_URL` to your production frontend URL
4. Update `VITE_API_BASE_URL` and `VITE_SOCKET_URL` to production backend URLs
5. Use environment variables provided by your hosting platform

## Testing the Configuration

After setting up the environment variables:

1. Start the backend: `npm run dev` (in backend directory)
2. Start the frontend: `npm run dev` (in frontend directory)
3. Check console logs for successful MongoDB connection
4. Verify API calls work between frontend and backend

## Troubleshooting

- **MongoDB Connection Error**: Ensure MongoDB is running and MONGODB_URI is correct
- **CORS Errors**: Check that FRONTEND_URL in backend matches your frontend URL
- **API Connection Issues**: Verify VITE_API_BASE_URL points to your running backend
- **JWT Errors**: Ensure JWT_SECRET is the same across all backend instances