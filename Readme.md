h# EduKanban - AI-Driven Personalized Learning Platform

🎓 **A complete, production-ready learning management system with AI-powered course generation, Kanban-style task management, real-time collaboration, and comprehensive analytics.**

## 🌟 Features

### ✅ **Implemented Features**

- **🚀 Modern Landing Page** - Beautiful, responsive design with clear value proposition
- **🔐 Authentication System** - Secure registration and login with JWT tokens
- **👤 Profile Management** - Comprehensive user profiles with learning statistics
- **🤖 AI Course Generation** - Personalized learning paths based on user goals and skill level
- **📋 Kanban Dashboard** - Interactive drag-and-drop task management (To Do → In Progress → Completed)
- **📚 Learning Content System** - AI-generated course content with video integration
- **📊 Assessment System** - Comprehensive quiz system with multiple question types
- **🎯 Analytics Dashboard** - Detailed learning metrics, progress charts, and performance tracking
- **💬 Chat Portal** - Real-time messaging with AI tutor integration
- **🎉 Celebration System** - Confetti animations and achievement tracking for milestones
- **📱 Responsive Design** - Fully mobile-optimized interface

## 🏗️ Architecture

### **Frontend (React + Vite)**
- **Framework**: React 18 with modern hooks and functional components
- **Styling**: Tailwind CSS for responsive, utility-first design
- **Animations**: Framer Motion for smooth transitions and celebrations
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context for global state
- **Build Tool**: Vite for fast development and optimized builds

### **Backend (Express.js + MongoDB)**
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based secure authentication
- **Real-time**: Socket.IO for chat and live updates
- **AI Integration**: OpenAI API for course generation and content creation
- **File Upload**: Multer for handling file uploads

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- OpenAI API key

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd EduKanban
```

2. **Install dependencies for all workspaces**
```bash
npm run install:all
```

3. **Set up environment variables**

**Backend (.env in backend/ directory):**
```env
MONGODB_URI=mongodb://localhost:27017/edukanban
JWT_SECRET=your-super-secure-jwt-secret
OPENAI_API_KEY=your-openai-api-key
PORT=5001
```

**Frontend (.env in frontend/ directory):**
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

4. **Start the development servers**
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
npm run dev:frontend  # Frontend on port 3000
npm run dev:backend   # Backend on port 5001
```

5. **Open your browser**
Navigate to `http://localhost:3000`

### **📱 Mobile/Network Access**

To access the application from mobile devices or other computers on the same network:

1. **Get your network IP address**:
```bash
./get-network-ip.sh
```

2. **Access from mobile device**:
   - Ensure your mobile device is connected to the same WiFi network
   - Open browser and navigate to: `http://YOUR_LOCAL_IP:3000`
   - Example: `http://192.168.1.13:3000`

3. **Configure firewall** (if needed):
   - macOS: System Preferences → Security & Privacy → Firewall → Firewall Options
   - Allow incoming connections for Node.js

**Note**: The application is now configured to accept connections from:
- localhost
- Local network IPs (192.168.x.x, 10.x.x.x)
- All devices on your network in development mode

## 📁 Project Structure

```
EduKanban/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Analytics.jsx    # Learning analytics dashboard
│   │   │   ├── AssessmentPage.jsx # Quiz and assessment system
│   │   │   ├── AuthPage.jsx     # Authentication forms
│   │   │   ├── Celebration.jsx  # Achievement celebrations
│   │   │   ├── ChatPortal.jsx   # Real-time messaging
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   └── KanbanBoard.jsx  # Task management board
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── App.jsx             # Root component
│   ├── main.jsx            # React entry point
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
├── backend/                # Express.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
└── package.json            # Workspace configuration
```

## 🎯 Core Features

### **1. AI-Powered Course Generation**
- Users input learning goals, current knowledge level, and time commitment
- AI generates comprehensive learning paths broken into modules and tasks
- Content includes theoretical explanations, practical exercises, and assessments

### **2. Kanban-Style Learning Management**
- Visual task board with drag-and-drop functionality
- Three main columns: "To Do", "In Progress", "Completed"
- Each task card shows progress, difficulty, and estimated time

### **3. Comprehensive Assessment System**
- Multiple question types: Multiple choice, True/False, Short answer, Essay
- Automated grading with detailed feedback
- Progress tracking and certificate generation
- Adaptive difficulty based on performance

### **4. Real-Time Collaboration**
- Chat portal with AI tutor integration
- User search and discovery
- File sharing capabilities
- Real-time notifications

### **5. Advanced Analytics**
- Learning progress visualization
- Time tracking and productivity metrics
- Performance analytics with charts and graphs
- Skill development tracking
- Export capabilities for reports

## 🎨 Design Philosophy

- **User-Centric**: Intuitive interface prioritizing learning experience
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive**: Mobile-first design with seamless device transitions
- **Modern**: Clean aesthetics with subtle animations and micro-interactions
- **Performance**: Optimized loading times and efficient state management

## 🔧 Technical Implementation

### **Component Architecture**
- **Modular Design**: Each feature is implemented as self-contained React components
- **Hook-based State**: Custom hooks for complex state management (useCelebration, useAuth)
- **Context API**: Global state management for user authentication and app-wide data
- **Responsive Components**: Mobile-first design with Tailwind CSS breakpoints

### **API Design**
- **RESTful Endpoints**: Clean, predictable API structure
- **Authentication Middleware**: JWT token validation for protected routes
- **Error Handling**: Comprehensive error responses with meaningful messages
- **Validation**: Input validation on both frontend and backend

### **Database Schema**
```javascript
// User Model
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  lastLogin: Date,
  learningStats: {
    coursesCompleted: Number,
    totalStudyTime: Number,
    averageScore: Number
  }
}

// Course Model
{
  title: String,
  description: String,
  difficulty: String,
  estimatedHours: Number,
  userId: ObjectId,
  modules: [ModuleSchema],
  createdAt: Date,
  updatedAt: Date
}

// Task Model
{
  title: String,
  description: String,
  courseId: ObjectId,
  status: String,
  difficulty: String,
  estimatedTime: Number,
  content: String,
  assessment: AssessmentSchema
}
```

## 🎓 Learning Features

### **Adaptive Learning Paths**
- Personalized curriculum based on user goals and skill assessment
- Dynamic difficulty adjustment based on performance
- Prerequisite tracking and intelligent content sequencing

### **Assessment System**
- **Question Types**: Multiple choice, true/false, short answer, essay questions
- **Automated Grading**: Instant feedback with detailed explanations
- **Progress Tracking**: Visual progress indicators and completion certificates
- **Performance Analytics**: Detailed insights into strengths and areas for improvement

### **Real-Time Collaboration**
- **AI Tutor**: Intelligent assistance and personalized learning recommendations
- **Peer Chat**: Connect with learners studying similar topics
- **Study Groups**: Collaborative learning sessions and discussions
- **File Sharing**: Share notes, resources, and study materials

## 📊 Analytics & Reporting

### **Learning Metrics**
- Time spent on each module and overall course progress
- Quiz scores and improvement trends over time
- Learning streaks and consistency tracking
- Skill development visualization

### **Performance Dashboards**
- Interactive charts showing learning progress and achievements
- Heatmaps displaying activity patterns and peak learning times
- Comparative analysis against learning goals and timelines
- Export functionality for progress reports

## 🎨 User Experience

### **Celebration System**
- **Achievement Unlocks**: Milestone celebrations with confetti effects
- **Progress Rewards**: Visual feedback for completing tasks and modules
- **Streak Tracking**: Encourage consistent learning habits
- **Certificate Generation**: Printable certificates for course completion

### **Accessibility Features**
- **ARIA Labels**: Screen reader compatibility
- **Keyboard Navigation**: Full keyboard accessibility support
- **Focus Management**: Proper focus indicators and tab order
- **Color Contrast**: WCAG compliant color schemes

## 🛠️ Development

### **Code Quality Standards**
- **ESLint**: Consistent code formatting and best practices
- **Component Size**: Maximum 250 lines per component for maintainability
- **TypeScript Ready**: Structured for easy TypeScript migration
- **Modern React**: Hooks-based architecture with functional components

### **Performance Optimizations**
- **Lazy Loading**: Dynamic imports for route-based code splitting
- **Memoization**: React.memo and useMemo for expensive computations
- **Image Optimization**: Responsive images with proper loading strategies
- **Bundle Optimization**: Vite-based build process for minimal bundle sizes

## 🔮 Future Enhancements

- **Video Integration**: YouTube API integration for supplementary learning content
- **Payment System**: Subscription and course purchase functionality
- **Mobile App**: React Native companion application
- **Advanced AI**: GPT-4 integration for more sophisticated content generation
- **Gamification**: Points, badges, and leaderboard systems
- **Offline Support**: Progressive Web App capabilities

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.