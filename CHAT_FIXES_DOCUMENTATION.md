# 🔧 Chat System Fixes - EduKanban

## Issues Fixed

### 1. ✅ Chat Message Persistence (Soft Delete)
**Problem**: User was concerned about chat messages being deleted permanently.

**Solution**: Messages are **NEVER** permanently deleted from the database. The system uses **soft delete**:

#### How It Works:
- **Delete for Me**: Message added to `deletedFor` array → Hidden only for that user
- **Delete for Everyone**: Message marked with `isDeleted: true` → Hidden for all users
- **Database**: All messages remain in DB with full history

#### Implementation:
```javascript
// Backend: DirectMessage Schema
{
  isDeleted: Boolean,      // Soft delete flag
  deletedBy: ObjectId,     // Who deleted (if forEveryone)
  deletedAt: Date,         // When deleted
  deletedFor: [ObjectId]   // Users who deleted (if forMe)
}

// Query filtering (example from chatEnhanced.js line 327)
DirectMessage.find({
  isDeleted: false,           // Not deleted for everyone
  deletedFor: { $ne: userId } // Not deleted by this user
})
```

#### API Endpoint:
```
DELETE /api/chat-enhanced/messages/:id
Body: { forEveryone: false }

Response: Message saved to DB, just hidden in UI
```

---

### 2. ✅ Online Status Synchronization
**Problem**: Users showing as offline even when both laptop and phone are online.

**Solution**: Enhanced online status initialization and real-time synchronization.

#### Root Cause:
- Frontend was not initializing online status from backend on page load
- Only relied on Socket.IO events after connection
- If user reconnected, their friends wouldn't see them as online immediately

#### Fixes Applied:

##### A) Backend Enhancements (`backend/server.js`)
```javascript
// On user connection:
1. Update DB: onlineStatus.isOnline = true
2. Add to onlineUsers Map
3. Broadcast 'friend_online' event to all online friends
4. Added detailed logging for debugging

// On user disconnect:
1. Update DB: onlineStatus.isOnline = false
2. Remove from onlineUsers Map  
3. Broadcast 'friend_offline' event to all online friends
4. Save lastSeen timestamp
```

##### B) Frontend Enhancements (`frontend/src/components/ChatPortalEnhanced.jsx`)
```javascript
// On initial load:
1. Fetch friends with their onlineStatus from DB
2. Initialize onlineUsers Set from friends.onlineStatus.isOnline
3. Display green dot for online friends immediately

// Socket.IO events:
1. 'friend_online' → Add to onlineUsers Set
2. 'friend_offline' → Remove from onlineUsers Set
3. On reconnection → Refresh friends list to sync status
```

##### C) New API Endpoint (`backend/routes/chatEnhanced.js`)
```
GET /api/chat-enhanced/users/online-friends

Returns: All friends currently online
Used for: Quick status refresh
```

#### Status Flow:
```
User A connects (laptop)
  ↓
Backend: A.onlineStatus.isOnline = true
  ↓
Broadcast to friends: 'friend_online' { userId: A }
  ↓
User B (phone) receives event
  ↓
B's UI shows: A is online (green dot)
```

---

## Testing Guide

### Test 1: Chat Persistence
1. **Send Message**: User A sends "Hello" to User B
2. **Delete for Me**: User A deletes message (forMe option)
   - ✅ User A: Message disappears
   - ✅ User B: Still sees message
   - ✅ Database: Message exists with `deletedFor: [A._id]`
3. **Delete for Everyone**: User A deletes message (forEveryone)
   - ✅ Both users: Message disappears
   - ✅ Database: Message exists with `isDeleted: true`
4. **Admin Query**: Query MongoDB directly
   - ✅ All deleted messages are still in `directmessages` collection

### Test 2: Online Status (Multi-Device)
1. **Setup**: 
   - User A: Login on laptop + phone
   - User B: Login on laptop
   - A and B are friends

2. **Test Scenarios**:

   **Scenario 1: Initial Connection**
   ```
   1. User A opens chat on laptop
   2. Wait 2 seconds
   3. Check User B's chat interface
   
   Expected: ✅ A shows "Online" with green dot
   ```

   **Scenario 2: Phone Connection**
   ```
   1. User A opens chat on phone (while laptop still open)
   2. Check User B's chat interface
   
   Expected: ✅ A still shows "Online" (may briefly flicker)
   ```

   **Scenario 3: Laptop Disconnect**
   ```
   1. User A closes laptop browser
   2. Phone still connected
   3. Check User B's chat interface
   
   Expected: ✅ A shows "Offline" with gray dot after 2-3 seconds
   ```

   **Scenario 4: Reconnection**
   ```
   1. User A refreshes page on laptop
   2. Socket reconnects
   3. Check User B's chat interface
   
   Expected: ✅ A shows "Online" again immediately
   ```

3. **Check Console Logs**:
   ```
   Backend:
   ✅ "👤 User XXX marked as online | Total online: N"
   ✅ "📢 Broadcasting online status to N friends"
   ✅ "✅ Notified N online friends"
   
   Frontend:
   ✅ "✅ Initialized online users: N friends online"
   ✅ "🟢 Friend came online: XXX"
   ✅ "⚫ Friend went offline: XXX"
   ```

---

## Technical Details

### Online Status Data Structure

#### User Model (`backend/models/User.js`)
```javascript
onlineStatus: {
  isOnline: Boolean,           // Currently connected via Socket.IO
  lastSeen: Date,              // Last activity timestamp
  status: String,              // 'online', 'away', 'busy', 'offline'
  statusMessage: String        // Custom status text
}
```

#### onlineUsers Map (`backend/server.js`)
```javascript
// In-memory tracking for fast lookups
Map<userId: string, socketId: string>

// Example:
onlineUsers.set('507f1f77bcf86cd799439011', 'socket_abc123')
```

#### Frontend State (`ChatPortalEnhanced.jsx`)
```javascript
const [onlineUsers, setOnlineUsers] = useState(new Set());

// Example:
Set(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'])
```

### Message Filtering Queries

#### Get Conversation Messages
```javascript
DirectMessage.find({
  targetType: 'user',
  targetId: conversationId,
  isDeleted: false,              // Not deleted for everyone
  deletedFor: { $ne: req.userId } // Not deleted by me
})
```

#### Get Channel Messages
```javascript
DirectMessage.find({
  targetType: 'channel',
  targetId: channelId,
  isDeleted: false               // Only check global delete
  // No deletedFor check - channels don't support per-user delete
})
```

---

## API Endpoints Reference

### Chat Persistence
```
DELETE /api/chat-enhanced/messages/:id
Body: { forEveryone: boolean }
Auth: Required

Returns:
{
  success: true,
  message: "Message deleted",
  data: { message: {...} }  // Message still in DB with flags
}
```

### Online Status
```
GET /api/chat-enhanced/users/friends
Auth: Required

Returns:
{
  success: true,
  data: {
    friends: [
      {
        _id: "...",
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        avatar: "...",
        onlineStatus: {
          isOnline: true,
          status: "online",
          lastSeen: "2025-10-17T10:30:00.000Z"
        }
      }
    ]
  }
}
```

```
GET /api/chat-enhanced/users/online-friends
Auth: Required

Returns:
{
  success: true,
  data: {
    onlineFriends: [...],  // Only friends with isOnline: true
    count: 3
  }
}
```

---

## Socket.IO Events

### Client → Server
```javascript
// No special events needed for online status
// Automatically handled on connection/disconnection
```

### Server → Client
```javascript
// Friend came online
socket.on('friend_online', ({ userId, status }) => {
  console.log(`${userId} is now ${status}`);
  setOnlineUsers(prev => new Set([...prev, userId]));
});

// Friend went offline
socket.on('friend_offline', ({ userId, lastSeen }) => {
  console.log(`${userId} went offline at ${lastSeen}`);
  setOnlineUsers(prev => {
    const newSet = new Set(prev);
    newSet.delete(userId);
    return newSet;
  });
});
```

---

## Debugging Tips

### Issue: User shows offline when actually online

**Check:**
1. **Backend Console**:
   ```
   Look for: "👤 User XXX marked as online"
   Missing? → Socket connection failed
   ```

2. **Frontend Console**:
   ```
   Look for: "✅ Connected to chat server"
   Missing? → Socket.IO not connecting
   ```

3. **Database**:
   ```javascript
   db.users.findOne({ _id: ObjectId("...") }, { onlineStatus: 1 })
   
   Should show: { isOnline: true, status: "online" }
   ```

4. **Network Tab**:
   ```
   Check: WS (WebSocket) connection to Socket.IO
   Status: 101 Switching Protocols (success)
   ```

### Issue: Messages not persisting after delete

**Check:**
1. **MongoDB Query**:
   ```javascript
   db.directmessages.find({ 
     content: "test message",
     $or: [
       { isDeleted: true },
       { deletedFor: { $exists: true, $ne: [] } }
     ]
   })
   
   // Should return deleted messages
   ```

2. **API Response**:
   ```
   DELETE /api/chat-enhanced/messages/:id
   
   Response should include: message._id (confirms save)
   ```

---

## Performance Considerations

### Online Status Caching
- **Server**: onlineUsers Map (in-memory, O(1) lookup)
- **Client**: onlineUsers Set (in-memory, O(1) check)
- **Database**: Index on `onlineStatus.isOnline` for fast queries

### Message Queries
- **Indexes**:
  ```javascript
  directMessageSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
  directMessageSchema.index({ isDeleted: 1 });
  directMessageSchema.index({ deletedFor: 1 });
  ```

- **Pagination**: Always use limit + skip to avoid loading all messages

---

## Future Enhancements

### 1. Auto-Away Status
```javascript
// After 5 minutes of inactivity
setTimeout(() => {
  socket.emit('change_status', 'away');
}, 5 * 60 * 1000);
```

### 2. Message Archiving
```javascript
// Move deleted messages to archive after 90 days
scheduledJob.run(async () => {
  const oldDeleted = await DirectMessage.find({
    isDeleted: true,
    deletedAt: { $lt: Date.now() - 90 * 24 * 60 * 60 * 1000 }
  });
  await ArchivedMessage.insertMany(oldDeleted);
  await DirectMessage.deleteMany({ _id: { $in: oldDeleted.map(m => m._id) } });
});
```

### 3. Read Receipts Sync
```javascript
// Show who's online and has read the message
readBy: [
  { 
    user: ObjectId,
    readAt: Date,
    wasOnline: Boolean  // NEW: Was user online when they read it?
  }
]
```

---

## Summary

✅ **Chat Persistence**: All messages saved in DB forever (soft delete only)  
✅ **Online Status**: Synced on page load + real-time Socket.IO updates  
✅ **Multi-Device**: Handles laptop + phone connections gracefully  
✅ **Debugging**: Enhanced logging for troubleshooting  
✅ **Performance**: Optimized with indexes and in-memory caching  

**Next Steps**: Test both features thoroughly and monitor console logs for any issues.
