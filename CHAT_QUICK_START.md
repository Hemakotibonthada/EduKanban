# 🚀 Chat Features Quick Start Guide

## Backend API Quick Reference

### AI Conversations
```javascript
// List conversations
GET /api/ai/conversations?status=active&limit=20&page=1

// Create conversation
POST /api/ai/conversations
Body: { title, description, topic, category }

// Get conversation with messages
GET /api/ai/conversations/:id

// Add message
POST /api/ai/conversations/:id/messages
Body: { role: 'user', content: 'Hello' }

// Update metadata
PUT /api/ai/conversations/:id
Body: { title: 'New Title' }

// Archive/restore
PUT /api/ai/conversations/:id/archive
Body: { archive: true }

// Delete
DELETE /api/ai/conversations/:id
```

### Message Reactions
```javascript
// Add reaction
POST /api/chat/messages/:messageId/reactions
Body: { emoji: '❤️' }

// Remove reaction
DELETE /api/chat/messages/:messageId/reactions/:emoji
```

### Threading
```javascript
// Get thread
GET /api/chat/messages/:messageId/thread?limit=50&page=1

// Reply to message
POST /api/chat/messages/:messageId/reply
Body: { content: 'Reply text' }
```

### Edit/Delete
```javascript
// Edit message (15 min window)
PUT /api/chat/messages/:messageId
Body: { content: 'Updated text' }

// Delete message
DELETE /api/chat/messages/:messageId
Body: { deleteForEveryone: false }
```

### Read Receipts
```javascript
// Mark as read
POST /api/chat/messages/:messageId/read

// Mark all as read
POST /api/chat/conversations/:conversationId/read-all
```

### Conversation Management
```javascript
// Get conversations
GET /api/chat/conversations?filter=all&search=&limit=20

// Pin conversation
PUT /api/chat/conversations/:id/pin
Body: { isPinned: true }

// Mute conversation
PUT /api/chat/conversations/:id/mute
Body: { isMuted: true }

// Archive conversation
PUT /api/chat/conversations/:id/archive
Body: { isArchived: true }

// Search messages
GET /api/chat/conversations/:id/search?query=hello&limit=20

// Pin message
PUT /api/chat/messages/:id/pin
Body: { isPinned: true }

// Get pinned messages
GET /api/chat/conversations/:id/pinned
```

---

## Frontend Hook Usage

### useAIChatStream
```javascript
import { useAIChatStream } from '../hooks/useAIChatStream';

function ChatComponent({ token }) {
  const {
    // State
    messages,
    isLoading,
    isStreaming,
    currentStreamMessage,
    currentConversation,
    conversations,
    
    // Chat Actions
    sendMessageStream,
    clearMessages,
    
    // Conversation Management
    loadConversations,
    loadConversation,
    createConversation,
    startNewConversation,
    updateConversation,
    archiveConversation,
    deleteConversation,
    
    // Utilities
    hasMessages,
    conversationId
  } = useAIChatStream(token, { autoSave: true });
  
  // Auto-saves messages to database
  const handleSend = async (message) => {
    await sendMessageStream(message);
  };
  
  // Load previous conversation
  const handleSelectConversation = async (id) => {
    await loadConversation(id);
  };
  
  // Start fresh chat
  const handleNewChat = async () => {
    await startNewConversation('New Chat');
  };
  
  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

---

## Component Integration

### AI Conversation Sidebar
```javascript
import AIConversationSidebar from './AIConversationSidebar';

<AIConversationSidebar
  conversations={conversations}
  currentConversation={currentConversation}
  isLoading={isLoadingConversations}
  onSelectConversation={loadConversation}
  onNewConversation={startNewConversation}
  onArchiveConversation={archiveConversation}
  onDeleteConversation={deleteConversation}
  onSearchConversations={(query) => loadConversations({ search: query })}
/>
```

---

## Real-time Socket.IO Events

### Listen for Events
```javascript
// In your socket setup
socket.on('message:reaction:add', ({ messageId, userId, emoji }) => {
  // Update UI with new reaction
});

socket.on('message:edited', ({ messageId, content, editedAt }) => {
  // Update message content
});

socket.on('message:read', ({ messageId, readBy, readAt }) => {
  // Update read receipt
});

socket.on('message:thread:reply', ({ parentId, reply }) => {
  // Add reply to thread
});
```

---

## Common Patterns

### Auto-save Conversation
```javascript
// Automatically happens with autoSave: true
const chat = useAIChatStream(token, { autoSave: true });

// Every message sent via sendMessageStream
// is automatically saved to the current conversation
await chat.sendMessageStream('Hello AI!');
```

### Load Existing Conversation
```javascript
// On component mount or conversation select
useEffect(() => {
  if (conversationId) {
    loadConversation(conversationId);
  }
}, [conversationId]);
```

### Search and Filter
```javascript
// Load filtered conversations
await loadConversations({
  status: 'active',    // 'active', 'archived', 'all'
  limit: 20,
  page: 1,
  sortBy: 'lastActivity',
  category: 'programming'
});
```

---

## Error Handling

### API Errors
```javascript
try {
  await deleteConversation(id);
} catch (error) {
  console.error('Failed to delete:', error);
  toast.error('Failed to delete conversation');
}
```

### Hook Auto-handles
- Failed message sends (shows error in UI)
- Network errors (shows toast notification)
- Auto-save failures (logs but doesn't block)

---

## Best Practices

### 1. Always Enable Auto-save
```javascript
const chat = useAIChatStream(token, { autoSave: true });
```

### 2. Load Conversations on Mount
```javascript
useEffect(() => {
  if (token) {
    loadConversations();
  }
}, [token]);
```

### 3. Clean Up on Unmount
```javascript
useEffect(() => {
  return () => {
    cancelRequest(); // Cleanup hook handles this
  };
}, []);
```

### 4. Handle Real-time Updates
```javascript
useEffect(() => {
  socket.on('message:reaction:add', handleReaction);
  return () => socket.off('message:reaction:add', handleReaction);
}, []);
```

---

## Performance Tips

1. **Pagination**: Always use `limit` and `page` parameters
2. **Search**: Use debounced search input
3. **Lazy Load**: Load threads only when needed
4. **Optimize Populates**: Only fetch required fields
5. **Cache**: Consider caching frequently accessed conversations

---

## Security Checklist

- ✅ All endpoints require authentication
- ✅ User authorization checked (must be participant)
- ✅ Input validation on all requests
- ✅ File upload limits enforced
- ✅ XSS protection enabled
- ✅ SQL injection prevented (using Mongoose)

---

## Testing Commands

### Test AI Conversation Flow
```bash
# 1. Create conversation
curl -X POST http://localhost:5000/api/ai/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}'

# 2. Add message
curl -X POST http://localhost:5000/api/ai/conversations/$CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"Hello"}'

# 3. Get messages
curl http://localhost:5000/api/ai/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test Reactions
```bash
# Add reaction
curl -X POST http://localhost:5000/api/chat/messages/$MSG_ID/reactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}'
```

### Test Threading
```bash
# Reply to message
curl -X POST http://localhost:5000/api/chat/messages/$MSG_ID/reply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"This is a reply"}'
```

---

## Troubleshooting

### Conversations Not Saving
- Check `autoSave` is enabled in hook options
- Verify token is valid
- Check browser console for errors

### Real-time Updates Not Working
- Ensure Socket.IO is connected
- Check socket events are properly registered
- Verify room subscriptions are correct

### Search Not Working
- Ensure text indexes are created on `DirectMessage.content`
- Run: `db.directmessages.createIndex({ content: "text" })`

### File Upload Failing
- Check file size limits
- Verify upload directory exists and is writable
- Check multer configuration

---

## Migration Guide

### Existing Chats
All existing chat functionality remains compatible. New features are additive.

### Database
No migrations needed - schemas already include all required fields.

### Frontend
1. Import new hook methods
2. Add sidebar component
3. Integrate real-time events
4. Add UI for new features

---

*Quick Start Guide - Get building! 🚀*
