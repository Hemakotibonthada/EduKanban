# EduKanban Setup Guide

🎓 **Complete setup guide for the AI-Driven Personalized Learning Platform**

## Quick Start

Follow these steps to run the full-stack EduKanban application locally:

### Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** - See installation instructions below
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)

#### MongoDB Installation (macOS)

If you don't have MongoDB installed, follow these steps:

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Add Homebrew to your PATH
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

2. **Install MongoDB Community Edition**:
   ```bash
   # Add MongoDB tap
   brew tap mongodb/brew
   
   # Install MongoDB
   brew install mongodb-community
   ```

3. **Start MongoDB service**:
   ```bash
   # Start MongoDB and set it to start at login
   brew services start mongodb/brew/mongodb-community
   
   # Verify MongoDB is running
   brew services list | grep mongodb
   ```

4. **Test MongoDB connection**:
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # Or test connection with command
   mongosh --eval "db.runCommand({connectionStatus : 1})"
   ```

#### Alternative: MongoDB Atlas (Cloud)

Instead of local MongoDB, you can use MongoDB Atlas (free tier available):
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string (replace `<username>` and `<password>`)
4. Use the connection string in your `.env` file

### Installation Steps

#### Step 1: Clone and Setup Project

1. **Navigate to the project directory:**
   ```bash
   cd /Users/hema/WorkSpace/Software/EduKanban
   ```

2. **Install all dependencies (frontend and backend):**
   ```bash
   npm run install:all
   ```
   
   Or install manually:
   ```bash
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

#### Step 2: Environment Configuration

4. **Create backend environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/edukanban
   # or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/edukanban
   
   # Authentication
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   
   # AI Integration
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Server Configuration
   PORT=5001
   NODE_ENV=development
   
   # CORS Origins (for production)
   FRONTEND_URL=http://localhost:3000
   ```

5. **Create frontend environment file:**
   ```bash
   cd frontend
   cp .env.example .env
   ```
   
   Edit `frontend/.env` with your configuration:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:5001/api
   VITE_SOCKET_URL=http://localhost:5001
   ```

#### Step 3: Database Setup

5. **Verify MongoDB is running:**
   ```bash
   # Check MongoDB service status
   brew services list | grep mongodb
   
   # Should show: mongodb-community started
   ```

6. **Test MongoDB connection:**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # You should see connection to mongodb://127.0.0.1:27017
   # Type 'exit' to quit the shell
   ```

7. **Create the database (optional):**
   ```bash
   # Connect to MongoDB and create database
   mongosh
   use edukanban
   db.users.insertOne({test: "connection"})
   db.users.deleteOne({test: "connection"})
   exit
   ```

#### Step 4: Start the Application

8. **Start the backend server** (in one terminal):
   ```bash
   cd backend
   npm run dev
   # Backend will run on http://localhost:5001
   ```

9. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   # Frontend will run on http://localhost:3000
   ```

   **OR start both servers concurrently from the root:**
   ```bash
   npm run dev
   # Starts both frontend (port 3000) and backend (port 5001)
   ```

10. **Open your browser:**
    Navigate to: `http://localhost:3000`

## What to Expect

Once both frontend and backend are running, you'll see:

### 🌟 **Landing Page**
- Beautiful, modern design with clear value proposition
- Sign up / Sign in options
- Feature overview and benefits

### 🔐 **Authentication System**
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality (if configured)

### 🎛️ **Main Dashboard**
Navigate through these powerful features:

1. **Dashboard Tab** - Overview of your learning journey:
   - Welcome banner with personalized greeting
   - Course progress summary
   - Quick stats and achievements
   - AI-powered course generation

2. **My Courses** - Course management:
   - View all enrolled courses
   - Continue where you left off
   - Course progress indicators
   - Difficulty and time estimates

3. **Task Board (Kanban)** - Interactive learning workflow:
   - Drag & drop tasks between "To Do", "In Progress", "Completed"
   - Visual task cards with progress indicators
   - Real-time status updates
   - Task filtering and search

4. **Analytics** - Comprehensive learning insights:
   - Progress visualization charts
   - Time tracking and study patterns
   - Performance metrics and trends
   - Learning streaks and consistency
   - Skill development tracking
   - Export capabilities

5. **Chat Portal** - Real-time collaboration:
   - AI tutor integration for instant help
   - Peer-to-peer messaging
   - File sharing capabilities
   - Study group discussions
   - User search and discovery

6. **Assessments** - Comprehensive testing system:
   - Multiple question types (MCQ, True/False, Short Answer, Essay)
   - Automated grading with detailed feedback
   - Timed assessments
   - Certificate generation
   - Performance analytics

### 🎉 **Celebration System**
- Confetti animations for achievements
- Milestone celebrations
- Achievement badges and tracking
- Progress rewards

## Project Structure

```
EduKanban/
├── Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Analytics.jsx    # Learning analytics dashboard
│   │   │   ├── AssessmentPage.jsx # Quiz and assessment system
│   │   │   ├── AuthPage.jsx     # Authentication forms
│   │   │   ├── Celebration.jsx  # Achievement celebrations
│   │   │   ├── ChatPortal.jsx   # Real-time messaging
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── KanbanBoard.jsx  # Task management board
│   │   │   ├── ProfilePage.jsx  # User profile management
│   │   │   ├── CourseContentPage.jsx # Learning content
│   │   │   ├── CourseGenerationPage.jsx # AI course creation
│   │   │   └── CoursesListPage.jsx # Course catalog
│   │   └── pages/
│   │       └── LandingPage.jsx  # Landing page
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Tailwind CSS styles
│   ├── index.html               # HTML template
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind configuration
│   └── postcss.config.js        # PostCSS configuration
│
├── Backend (Express.js + MongoDB)
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js             # User model
│   │   ├── Course.js           # Course model
│   │   ├── Task.js             # Task model
│   │   └── Assessment.js       # Assessment model
│   ├── routes/                  # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── courses.js          # Course management
│   │   ├── tasks.js            # Task operations
│   │   ├── assessments.js      # Quiz and testing
│   │   ├── analytics.js        # Learning analytics
│   │   └── chat.js             # Chat functionality
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js             # JWT authentication
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── services/               # Business logic
│   │   ├── aiService.js        # OpenAI integration
│   │   ├── emailService.js     # Email notifications
│   │   └── socketService.js    # Real-time features
│   ├── config/                 # Configuration
│   │   ├── database.js         # MongoDB connection
│   │   └── constants.js        # App constants
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables
│
├── Documentation
│   ├── Readme.md               # Project overview
│   ├── SETUP_GUIDE.md          # This setup guide
│   └── entire_project_document.md # Technical documentation
```

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start Vite development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite with Jest

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Issues:**
   ```bash
   # Check if MongoDB is running
   brew services list | grep mongodb
   
   # Start MongoDB service
   brew services start mongodb-community
   
   # Check MongoDB logs
   tail -f /usr/local/var/log/mongodb/mongo.log
   ```

2. **Port conflicts:**
   - Frontend (5173): `npm run dev -- --port 3000`
   - Backend (5001): Change PORT in `.env` file

3. **OpenAI API Issues:**
   - Verify API key in `backend/.env`
   - Check API quota and billing status
   - Ensure proper API key format (starts with `sk-`)

4. **Dependencies not installing:**
   ```bash
   # Clear caches and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **CORS errors:**
   - Ensure backend is running on port 5001
   - Check FRONTEND_URL in backend `.env`
   - Verify frontend is accessing correct backend URL

6. **Authentication issues:**
   - Check JWT_SECRET is set in backend `.env`
   - Clear browser localStorage: `localStorage.clear()`
   - Verify token expiration settings

7. **Real-time features not working:**
   - Ensure Socket.IO connection is established
   - Check browser network tab for WebSocket connections
   - Verify firewall settings

### Debug Commands

```bash
# Check Node.js version
node --version

# Check MongoDB status
mongosh --eval "db.runCommand({connectionStatus : 1})"

# Test backend API
curl http://localhost:5001/api/health

# Check frontend build
npm run build

# View backend logs
cd backend && npm run dev | grep -i error
```

### Getting Help

If you encounter issues:
1. Check browser console and network tab
2. Review backend server logs
3. Verify all environment variables are set
4. Ensure MongoDB is running and accessible
5. Test API endpoints with curl or Postman
6. Check Node.js version compatibility

## Features Overview

Once both servers are running, explore these comprehensive features:

### 🤖 **AI-Powered Course Generation**
- Enter learning goals, current knowledge level, and time commitment
- AI generates personalized curriculum with modules and tasks
- Adaptive difficulty based on user assessment
- Integration with OpenAI GPT models

### 📚 **Comprehensive Learning System**
- **Course Management**: Create, edit, and organize learning paths
- **Content Delivery**: AI-generated text content with YouTube video integration
- **Progress Tracking**: Visual indicators and completion percentages
- **Bookmark System**: Save important concepts and resources

### 📋 **Advanced Kanban Board**
- **Drag & Drop**: Smooth task management with visual feedback
- **Status Columns**: To Do → In Progress → Under Review → Completed
- **Task Details**: Difficulty, estimated time, prerequisites
- **Filtering**: Search, sort, and filter tasks by various criteria

### 🎓 **Assessment & Testing System**
- **Multiple Question Types**: MCQ, True/False, Short Answer, Essay
- **Automated Grading**: Instant feedback with detailed explanations
- **Adaptive Testing**: Difficulty adjusts based on performance
- **Certificates**: Generate completion certificates with achievements
- **Performance Analytics**: Track scores, time spent, improvement trends

### 📊 **Advanced Analytics Dashboard**
- **Learning Metrics**: Time tracking, completion rates, study patterns
- **Interactive Charts**: Progress visualization, learning curves, heatmaps
- **Performance Insights**: Strengths, weaknesses, recommendations
- **Export Options**: PDF reports, CSV data export
- **Goal Tracking**: Set and monitor learning objectives

### 💬 **Real-Time Chat & Collaboration**
- **AI Tutor**: Intelligent assistance and personalized help
- **Peer Chat**: Connect with other learners
- **Study Groups**: Collaborative learning sessions
- **File Sharing**: Upload and share resources, notes, assignments
- **User Discovery**: Find learners with similar interests or courses

### � **Gamification & Motivation**
- **Achievement System**: Unlock badges for milestones and accomplishments
- **Celebration Effects**: Confetti animations for course completions
- **Learning Streaks**: Track consecutive study days
- **Progress Rewards**: Visual feedback for completing tasks and modules
- **Leaderboards**: Compare progress with peers (if enabled)

### 🔧 **User Experience Features**
- **Responsive Design**: Seamless experience across desktop, tablet, mobile
- **Dark/Light Mode**: Theme switching for user preference
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Offline Support**: Basic functionality when internet is limited
- **Performance**: Optimized loading times and smooth animations

## Production Deployment

### Frontend Deployment

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy to static hosting:**
   - **Netlify**: Drag and drop the `dist` folder
   - **Vercel**: Connect GitHub repository for automatic deployments
   - **GitHub Pages**: Use `gh-pages` package for deployment

### Backend Deployment

1. **Prepare for production:**
   ```bash
   cd backend
   npm install --production
   ```

2. **Set production environment variables:**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edukanban
   JWT_SECRET=your-production-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   PORT=5001
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Deploy options:**
   - **Heroku**: Use Heroku CLI with Procfile
   - **Railway**: Connect GitHub repository
   - **DigitalOcean**: Use App Platform or Droplets
   - **AWS**: Use Elastic Beanstalk or EC2

### Environment Setup Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] OpenAI API key with sufficient credits
- [ ] JWT secret generated (use `openssl rand -base64 32`)
- [ ] CORS origins configured for production domains
- [ ] SSL certificates configured (HTTPS)
- [ ] Environment variables set in hosting platform
- [ ] Database indexes created for performance
- [ ] Monitoring and logging configured

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Course Management
- `GET /api/courses` - Get user courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Task Management
- `GET /api/tasks` - Get tasks for a course
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### Assessment System
- `GET /api/assessments/:taskId` - Get assessment for task
- `POST /api/assessments/:taskId/submit` - Submit assessment
- `GET /api/assessments/:taskId/results` - Get assessment results

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/progress` - Get learning progress
- `GET /api/analytics/export` - Export analytics data

### Chat System
- `GET /api/chat/channels` - Get user chat channels
- `POST /api/chat/channels` - Create new channel
- `GET /api/chat/messages/:channelId` - Get channel messages
- `POST /api/chat/messages` - Send message

## Testing

### Frontend Testing
```bash
# Run component tests
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

### Backend Testing
```bash
cd backend
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test coverage
npm run test:coverage
```

## Performance Optimization

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle analysis with `npm run build -- --analyze`
- Service worker for caching

### Backend Optimizations
- Database indexing for frequently queried fields
- Redis caching for session and API responses
- API rate limiting and request optimization
- CDN for static assets

## Security Considerations

### Frontend Security
- Environment variables for sensitive data
- Input validation and sanitization
- XSS protection with proper escaping
- HTTPS enforcement

### Backend Security
- JWT token expiration and refresh
- Password hashing with bcrypt
- CORS configuration
- Rate limiting and DDoS protection
- Input validation with express-validator
- SQL injection prevention
- Security headers with Helmet.js

## Monitoring & Maintenance

### Application Monitoring
- Error tracking with Sentry or similar
- Performance monitoring with New Relic
- Uptime monitoring with UptimeRobot
- Database performance monitoring

### Regular Maintenance
- Dependency updates with `npm audit`
- Database backup and recovery procedures
- Log rotation and cleanup
- Security patch management

## Next Steps

1. **Initial Setup**: Follow the installation steps above
2. **Configuration**: Set up environment variables and database
3. **Exploration**: Try all features - course generation, assessments, chat
4. **Customization**: Modify components and styling to fit your needs
5. **Deployment**: Deploy to production when ready
6. **Monitoring**: Set up logging and error tracking
7. **Scaling**: Implement caching and optimization as needed

## Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)

## Support & Contributing

- **Issues**: Report bugs and feature requests in GitHub Issues
- **Documentation**: Help improve this setup guide
- **Code Contributions**: Submit pull requests with improvements
- **Community**: Join discussions about AI-powered learning platforms

---

🎓 **Enjoy building the future of personalized learning with EduKanban!** 🚀