# 🚀 Quick Reference Card - Chat Features

## 📁 File Locations

```
frontend/src/
├── components/
│   ├── AIConversationSidebar.jsx      ✅ INTEGRATED
│   ├── MessageReactionPicker.jsx      📦 Ready
│   ├── MessageReactions.jsx           📦 Ready
│   ├── ThreadView.jsx                 📦 Ready
│   ├── MessageActions.jsx             📦 Ready
│   ├── ReadReceipt.jsx                📦 Ready
│   ├── ConversationMenu.jsx           📦 Ready
│   ├── MessageSearch.jsx              📦 Ready
│   ├── PinnedMessagesPanel.jsx        📦 Ready
│   ├── FilePreview.jsx                📦 Ready
│   └── ChatPortalEnhanced.jsx         🔄 Integrate here
│
└── hooks/
    ├── useAIChatStream.js             ✅ INTEGRATED
    └── useRealtimeChat.js             📦 Ready
```

---

## 🎯 Component Props Quick Reference

### MessageReactionPicker
```jsx
<MessageReactionPicker
  messageId={string}          // Required
  currentUserId={string}      // Required
  onReactionAdd={function}    // Optional callback
/>
```

### MessageReactions
```jsx
<MessageReactions
  messageId={string}          // Required
  currentUserId={string}      // Required
  onReactionToggle={function} // Optional callback
/>
```

### MessageActions
```jsx
<MessageActions
  message={object}            // Required: { _id, content, sender, createdAt }
  currentUserId={string}      // Required
  onEdit={function}           // Optional: (messageId, newContent) => void
  onDelete={function}         // Optional: (messageId) => void
  isAIMessage={boolean}       // Optional: default false
/>
```

### ReadReceipt
```jsx
<ReadReceipt
  message={object}            // Required: { _id, sender, readBy }
  currentUserId={string}      // Required
  conversationId={string}     // Required
  socket={object}             // Optional: Socket.IO instance
  onMessageRead={function}    // Optional callback
/>
```

### ThreadView
```jsx
<ThreadView
  parentMessageId={string}    // Required
  currentUserId={string}      // Required
  onClose={function}          // Required
  socket={object}             // Optional: Socket.IO instance
/>
```

### ConversationMenu
```jsx
<ConversationMenu
  conversation={object}       // Required: { _id, isPinned, isMuted, isArchived }
  onUpdate={function}         // Optional: (id, updates) => void
  onDelete={function}         // Optional: (id) => void
  onSearch={function}         // Optional: () => void
  position="right"            // Optional: "left" | "right"
/>
```

### MessageSearch
```jsx
<MessageSearch
  conversationId={string}     // Required
  isOpen={boolean}            // Required
  onClose={function}          // Required
  onMessageSelect={function}  // Optional: (messageId) => void
/>
```

### PinnedMessagesPanel
```jsx
<PinnedMessagesPanel
  conversationId={string}     // Required
  onMessageClick={function}   // Optional: (messageId) => void
  onUnpin={function}          // Optional: (messageId) => void
  initiallyExpanded={boolean} // Optional: default false
/>
```

### FilePreview
```jsx
<FilePreview
  file={object}               // Required: { _id, filename, mimetype, url }
  inline={boolean}            // Optional: default true
  maxHeight="400px"           // Optional
  showDownload={boolean}      // Optional: default true
  lazyLoad={boolean}          // Optional: default true
/>
```

---

## 🔌 useRealtimeChat Hook

### Usage
```javascript
import useRealtimeChat from '../hooks/useRealtimeChat';

const { emitTyping, joinConversation, leaveConversation, isConnected } = 
  useRealtimeChat(socket, callbacks, currentUserId);
```

### Callbacks Object
```javascript
const callbacks = {
  onReactionAdded: (data) => { /* { messageId, reaction, userId } */ },
  onReactionRemoved: (data) => { /* { messageId, reaction, userId } */ },
  onMessageEdited: (data) => { /* { messageId, content, editedAt } */ },
  onMessageDeleted: (data) => { /* { messageId, conversationId } */ },
  onMessageRead: (data) => { /* { messageId, userId, conversationId } */ },
  onConversationReadAll: (data) => { /* { conversationId, userId } */ },
  onThreadReply: (data) => { /* { threadId, reply, parentMessageId } */ },
  onMessagePinned: (data) => { /* { messageId, isPinned, pinnedBy } */ },
  onNewMessage: (data) => { /* { message, conversationId } */ }, // Optional
  onTyping: (data) => { /* { userId, conversationId, isTyping } */ } // Optional
};
```

### Helper Functions
```javascript
// Emit typing indicator
emitTyping(conversationId, true);  // Started typing
emitTyping(conversationId, false); // Stopped typing

// Join conversation room
joinConversation(conversationId);

// Leave conversation room
leaveConversation(conversationId);

// Check connection status
if (isConnected) {
  // Socket is connected
}
```

---

## 🌐 API Endpoints

### Message Reactions
```javascript
// Add reaction
POST /api/chat/messages/:messageId/reactions
Body: { reaction: "👍" }

// Remove reaction
DELETE /api/chat/messages/:messageId/reactions/:reaction
```

### Message Threading
```javascript
// Get thread
GET /api/chat/messages/:messageId/thread

// Add reply
POST /api/chat/messages/:messageId/thread
Body: { content: "Reply text" }
```

### Message Actions
```javascript
// Edit message (15min window)
PUT /api/chat/messages/:messageId
Body: { content: "New content" }

// Delete message
DELETE /api/chat/messages/:messageId
```

### Read Receipts
```javascript
// Mark message as read
POST /api/chat/messages/:messageId/read
Body: { conversationId: "..." }

// Mark all as read
POST /api/chat/conversations/:conversationId/read
```

### Conversation Management
```javascript
// Pin/unpin
PUT /api/chat/conversations/:conversationId/pin
Body: { isPinned: true }

// Mute/unmute
PUT /api/chat/conversations/:conversationId/mute
Body: { isMuted: true }

// Archive/unarchive
PUT /api/chat/conversations/:conversationId/archive
Body: { isArchived: true }

// Delete
DELETE /api/chat/conversations/:conversationId
```

### Message Pinning
```javascript
// Pin/unpin message
PUT /api/chat/messages/:messageId/pin
Body: { isPinned: true }

// Get pinned messages
GET /api/chat/conversations/:conversationId/pinned
```

### Search
```javascript
// Search messages
GET /api/chat/conversations/:conversationId/search?query=...
```

---

## 📡 Socket.IO Events

### Listen (Client)
```javascript
socket.on('message:reaction:add', (data) => { });
socket.on('message:reaction:remove', (data) => { });
socket.on('message:edited', (data) => { });
socket.on('message:deleted', (data) => { });
socket.on('message:read', (data) => { });
socket.on('conversation:read:all', (data) => { });
socket.on('message:thread:reply', (data) => { });
socket.on('message:pinned', (data) => { });
```

### Emit (Client)
```javascript
socket.emit('typing', { conversationId, isTyping });
socket.emit('join:conversation', { conversationId });
socket.emit('leave:conversation', { conversationId });
```

---

## 🎨 Styling Classes

### Message Container
```jsx
className="message-container group hover:bg-gray-50 dark:hover:bg-gray-800/50"
```

### Action Button (Hover Show)
```jsx
className="opacity-0 group-hover:opacity-100 transition-opacity"
```

### Status Indicators
```jsx
// Pinned
<span className="text-xs">📌</span>

// Muted
<span className="text-xs">🔇</span>

// Edited
<span className="text-xs text-gray-400 italic">(edited)</span>
```

---

## ⌨️ Keyboard Shortcuts

### Message Search
- `↑` / `↓` - Navigate results
- `Enter` - Next result
- `Esc` - Close search

### Message Actions
- `Enter` - Save edit
- `Esc` - Cancel edit

### Thread View
- `Esc` - Close thread
- `Enter` - Send reply

---

## 🔧 Common Patterns

### Scroll to Message
```javascript
const scrollToMessage = (messageId) => {
  const element = document.getElementById(`message-${messageId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
    setTimeout(() => {
      element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
    }, 2000);
  }
};
```

### Format Timestamp
```javascript
const formatTimestamp = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
```

### Get Backend URL
```javascript
const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
};
```

---

## 🐛 Debugging Tips

### Check Socket Connection
```javascript
console.log('Socket connected:', socket?.connected);
console.log('Socket ID:', socket?.id);
```

### Verify Auth Token
```javascript
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
```

### Test API Endpoint
```javascript
const response = await fetch(`${getBackendURL()}/api/chat/messages`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('API Response:', response.status);
```

### Monitor Real-time Events
```javascript
socket.onAny((eventName, ...args) => {
  console.log('Socket event:', eventName, args);
});
```

---

## ✅ Integration Checklist

- [ ] Import all components
- [ ] Add state management
- [ ] Setup useRealtimeChat hook
- [ ] Add PinnedMessagesPanel to top
- [ ] Add MessageSearch with toggle
- [ ] Update message rendering
- [ ] Add ThreadView sidebar
- [ ] Integrate ConversationMenu
- [ ] Add FilePreview to messages
- [ ] Join/leave conversation rooms
- [ ] Test all features
- [ ] Verify real-time updates
- [ ] Check mobile responsive
- [ ] Test dark mode

---

## 📚 Documentation Files

1. **INTEGRATION_GUIDE.md** - Step-by-step integration
2. **IMPLEMENTATION_STATUS.md** - Detailed component specs
3. **CHAT_FEATURES_IMPLEMENTATION.md** - Full technical docs
4. **COMPLETION_SUMMARY.md** - Overview and stats
5. **QUICK_REFERENCE.md** - This file

---

## 🎯 Success Metrics

After integration, verify:
- ✅ All 10 components render
- ✅ Real-time events work
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Dark mode works
- ✅ Performance is good (no lag)
- ✅ UI looks professional

---

## 🚀 Deploy Checklist

Before production:
- [ ] Environment variables set
- [ ] Backend APIs tested
- [ ] Socket.IO configured
- [ ] CORS settings correct
- [ ] File upload limits set
- [ ] Error tracking enabled
- [ ] Analytics integrated
- [ ] Performance monitoring
- [ ] Security audit passed

---

**Ready to integrate? Follow INTEGRATION_GUIDE.md! 🎉**
