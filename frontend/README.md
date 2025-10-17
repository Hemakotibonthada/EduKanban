# EduKanban Frontend

React-based frontend for the EduKanban AI-Powered Adaptive Learning Platform.

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Key Features

- 🎯 **Kanban Board** - Drag-and-drop task management
- 🤖 **AI Course Generation** - OpenAI-powered course creation
- 📊 **Analytics Dashboard** - Progress tracking with charts
- 💬 **Real-time Chat** - Socket.IO integration
- 🎉 **Celebrations** - Interactive user feedback
- 📱 **Responsive Design** - Mobile-first approach

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── config/        # Configuration files
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5001/api/`.

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```