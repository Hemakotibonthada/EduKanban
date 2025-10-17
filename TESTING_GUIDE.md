# 🧪 EduKanban Chat System - Testing Guide

## 📋 Current Status

✅ **Backend Server**: Running on http://localhost:5001
✅ **Frontend Server**: Running on http://localhost:3000
✅ **MongoDB**: Connected
✅ **Socket.IO**: Configured and ready

---

## 🎯 Test Plan

### **Phase 1: User Setup & Authentication**

#### Test 1.1: Create Test Accounts
```
Goal: Create 2 user accounts to test friend requests and messaging
Steps:
1. Open http://localhost:3000 in browser
2. Register user "Alice" with email alice@test.com
3. Open incognito window
4. Register user "Bob" with email bob@test.com
5. Keep both windows open for testing

Expected: Both users successfully registered and logged in
```

#### Test 1.2: Verify Dashboard Access
```
Goal: Ensure both users can access the dashboard
Steps:
1. Login as Alice
2. Navigate to dashboard
3. Verify ChatPortal component loads

Expected: Dashboard displays with chat interface visible
```

---

### **Phase 2: Friend Request System**

#### Test 2.1: Search for Users
```
Goal: Test user search functionality
Steps:
1. As Alice, click "Add Friend" button in Friends tab
2. UserSearchModal should open
3. Search for "Bob"
4. Verify Bob appears in search results

Expected: Bob's profile shows in search results with "Send Request" button

API Endpoint: GET /api/chat-enhanced/users/search?q=Bob
```

#### Test 2.2: Send Friend Request
```
Goal: Send friend request from Alice to Bob
Steps:
1. In search modal, click "Send Request" next to Bob
2. Optionally add a connection reason
3. Submit the request
4. Toast notification should confirm

Expected: 
- Success toast: "Friend request sent!"
- Request appears in Alice's "Sent Requests"
- Request appears in Bob's "Received Requests"

API Endpoint: POST /api/chat-enhanced/friend-requests
Socket Event: friend_request_received (sent to Bob)

Check in MongoDB:
db.friendrequests.find({ sender: "Alice's ID", recipient: "Bob's ID" })
```

#### Test 2.3: Receive & Accept Friend Request
```
Goal: Bob accepts Alice's friend request
Steps:
1. Switch to Bob's window
2. Navigate to Friends tab
3. Check "Received Requests" section
4. See Alice's request with accept/reject buttons
5. Click "Accept"

Expected:
- Request disappears from both users' pending lists
- Alice appears in Bob's friends list
- Bob appears in Alice's friends list
- Both users see green online status indicator
- Toast: "Friend request accepted!"

API Endpoint: PUT /api/chat-enhanced/friend-requests/:id/accept
Socket Events: 
- friend_request_accepted (to Alice)
- friend_online (both users see each other online)

Check in MongoDB:
db.users.findOne({ _id: "Alice's ID" }) 
// Should have Bob in friends array
```

#### Test 2.4: Reject Friend Request
```
Goal: Test rejecting a friend request
Steps:
1. Have a third user send request to Alice
2. Alice clicks "Reject"

Expected:
- Request removed from list
- No friendship created
- Toast: "Friend request rejected"

API Endpoint: PUT /api/chat-enhanced/friend-requests/:id/reject
```

---

### **Phase 3: Direct Messaging**

#### Test 3.1: Start Direct Conversation
```
Goal: Alice sends message to Bob
Steps:
1. As Alice, go to "Direct Messages" tab
2. Click on Bob in friends list
3. Conversation opens on right side
4. Type "Hello Bob!" in message input
5. Click Send

Expected:
- Message appears immediately in Alice's chat (optimistic UI)
- Bob receives message in real-time
- Message displays with timestamp
- Alice's avatar shows next to message

API Endpoint: POST /api/chat-enhanced/conversations/:id/messages
Socket Event: receive_message (sent to Bob)

Check in MongoDB:
db.directmessages.find({ sender: "Alice's ID", recipient: "Bob's ID" })
```

#### Test 3.2: Real-time Message Delivery
```
Goal: Verify Socket.IO real-time messaging
Steps:
1. Keep both Alice and Bob windows visible
2. Alice sends: "Testing real-time!"
3. Observe Bob's window

Expected:
- Message appears in Bob's chat within 1 second
- No page refresh needed
- Message order preserved
- Socket.IO connection indicator shows "Connected"

Socket Events:
- send_message (from Alice)
- receive_message (to Bob)
```

#### Test 3.3: Typing Indicators
```
Goal: Show when someone is typing
Steps:
1. As Bob, start typing in message input
2. Watch Alice's window

Expected:
- Alice sees "Bob is typing..." indicator
- Indicator disappears when Bob stops typing (after 3 seconds)
- Animated dots while typing

Socket Events:
- typing (from Bob)
- stop_typing (after timeout)
```

#### Test 3.4: Read Receipts
```
Goal: Track message read status
Steps:
1. Alice sends message to Bob
2. Message shows as "Sent" (single check)
3. Bob opens the conversation
4. Message updates to "Read" (double check)

Expected:
- Clock icon = pending
- Single check = delivered
- Double check = read
- Read timestamp visible on hover

Socket Event: mark_read
API: Message.markAsRead(userId)
```

---

### **Phase 4: Message Features**

#### Test 4.1: Emoji Reactions
```
Goal: Add emoji reactions to messages
Steps:
1. Hover over any message
2. Click reaction button (smile icon)
3. Emoji picker opens
4. Select 👍 emoji
5. Reaction appears below message

Expected:
- Emoji badge shows under message
- Shows "1" count initially
- If Bob also reacts with 👍, count becomes "2"
- Clicking again removes your reaction

API Endpoint: 
- POST /api/chat-enhanced/messages/:id/reactions
- DELETE /api/chat-enhanced/messages/:id/reactions/:emoji

Socket Event: message_reaction_added
```

#### Test 4.2: Reply to Message
```
Goal: Reply to a specific message
Steps:
1. Click reply icon on a message
2. Reply indicator shows above input
3. Type reply: "Great point!"
4. Send message

Expected:
- Reply shows original message context
- Visual connection between messages
- Can click to jump to original message
- Shows "Replying to Alice" indicator

Schema: DirectMessage.replyTo (references original message)
```

#### Test 4.3: Star/Save Messages
```
Goal: Save important messages
Steps:
1. Click star icon on message
2. Message gets highlighted
3. Check "Starred Messages" section

Expected:
- Star icon turns gold
- Message saved to starred collection
- Can unstar by clicking again
- Starred messages persist across sessions

API Endpoint: POST /api/chat-enhanced/messages/:id/star
Schema: DirectMessage.starred: true
```

---

### **Phase 5: File Uploads**

#### Test 5.1: Upload Image
```
Goal: Share image file in chat
Steps:
1. Click paperclip icon or drag image into chat
2. Select image.jpg (< 10MB)
3. Preview appears before sending
4. Click send

Expected:
- Image thumbnail generated automatically
- Message shows image preview
- Click to view full size
- Download option available
- Image stored in /uploads/images/

API Endpoint: POST /api/chat-enhanced/upload
Service: FileUploadService.uploadFiles()

Check:
- File exists in backend/uploads/images/
- Thumbnail in backend/uploads/thumbnails/
- FileAttachment document created in MongoDB
```

#### Test 5.2: Upload PDF Document
```
Goal: Share PDF file
Steps:
1. Upload document.pdf (< 50MB)
2. Send in chat

Expected:
- PDF icon shows in message
- File name and size displayed
- Download button works
- Opens in new tab when clicked
- Stored in /uploads/documents/

Supported: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx

File validation:
- Max size: 100MB
- Mime type checked
- Virus scan placeholder (scanned: false)
```

#### Test 5.3: Upload Video
```
Goal: Share video file
Steps:
1. Upload video.mp4 (< 100MB)
2. Send in chat

Expected:
- Video preview with play button
- Inline video player
- Thumbnail generated (if ffmpeg available)
- Size and duration shown
- Stored in /uploads/videos/

Note: Video thumbnails require ffmpeg installation
```

#### Test 5.4: Multiple Files
```
Goal: Upload multiple files at once
Steps:
1. Drag & drop 3 files (image, pdf, word doc)
2. All show in preview
3. Can remove individual files
4. Send all together

Expected:
- All files uploaded successfully
- Progress indicators during upload
- Single message with multiple attachments
- Individual download for each file

Max files: 10 per message
Total size: 100MB limit
```

#### Test 5.5: Drag & Drop Upload
```
Goal: Test drag & drop functionality
Steps:
1. Drag file from desktop
2. Drop zone highlights
3. Drop file

Expected:
- Blue border during drag over
- "Drop files here" indicator
- Immediate upload on drop
- Works for all file types

Library: react-dropzone
```

---

### **Phase 6: Communities**

#### Test 6.1: Create Community
```
Goal: Create a community/server
Steps:
1. Go to "Communities" tab
2. Click "Create Community" button
3. Fill form:
   - Name: "JavaScript Learners"
   - Description: "Learn JS together"
   - Privacy: Public
   - Category: Programming
   - Tags: javascript, coding, learning
4. Submit

Expected:
- Community created successfully
- Appears in "My Communities"
- Default "general" channel created
- User is owner with all permissions
- Toast: "Community created!"

API Endpoint: POST /api/chat-enhanced/communities
Schema: Community with owner, members[], channels[]

Check in MongoDB:
db.communities.findOne({ name: "JavaScript Learners" })
// Should have:
// - owner: Alice's ID
// - members: [{ user: Alice, role: 'owner' }]
// - channels: [{ name: 'general', type: 'text' }]
```

#### Test 6.2: Join Community
```
Goal: Bob joins Alice's community
Steps:
1. As Bob, search/browse communities
2. Find "JavaScript Learners"
3. Click "Join"

Expected:
- Bob added to members list
- Community appears in Bob's list
- Bob can see all public channels
- Welcome message in #general
- Toast: "Joined JavaScript Learners!"

API Endpoint: POST /api/chat-enhanced/communities/:id/join

Socket Event: user_joined_community
- Broadcast to all community members
- Update member count
```

#### Test 6.3: Create Channel in Community
```
Goal: Add new channel to community
Steps:
1. As community owner/admin
2. Click "+ Add Channel"
3. Fill form:
   - Name: "resources"
   - Type: Text
   - Visibility: Public
   - Description: "Share learning resources"
4. Create

Expected:
- Channel appears in community sidebar
- All members can see it (public)
- Empty message state
- Channel settings accessible

API Endpoint: POST /api/chat-enhanced/communities/:id/channels
Channel Types: text, voice, announcement, resources
Visibility: public, private, restricted
```

#### Test 6.4: Send Message in Channel
```
Goal: Chat in community channel
Steps:
1. Select #general channel
2. Type: "Welcome everyone!"
3. Send

Expected:
- Message visible to all community members
- Shows in #general channel only
- User avatar and role badge visible
- Can @mention other members

API Endpoint: POST /api/chat-enhanced/channels/:id/messages
Socket Event: Broadcast to channel_:channelId room
```

#### Test 6.5: Leave Community
```
Goal: Leave a community
Steps:
1. Click community settings
2. Click "Leave Community"
3. Confirm

Expected:
- Community removed from list
- No longer receive messages
- Removed from members list
- Can rejoin later (if public)

API Endpoint: POST /api/chat-enhanced/communities/:id/leave
Note: Owners cannot leave (must transfer ownership first)
```

---

### **Phase 7: Groups**

#### Test 7.1: Create Group
```
Goal: Create private group chat
Steps:
1. Go to "Groups" tab
2. Click "Create Group"
3. Enter name: "Study Group"
4. Select friends: Bob, Charlie
5. Create

Expected:
- Group created with 3 members
- Appears in Groups tab
- Group chat opens
- All members notified

API Endpoint: POST /api/chat-enhanced/groups
Schema: Group with members[], admin

Socket Event: added_to_group (to Bob & Charlie)
```

#### Test 7.2: Group Messaging
```
Goal: Chat in group
Steps:
1. Open study group
2. Alice: "Who wants to study tonight?"
3. Bob replies in real-time
4. Charlie sees both messages

Expected:
- All 3 members see messages
- Real-time delivery
- Member avatars visible
- Group has shared message history

API Endpoint: POST /api/chat-enhanced/groups/:id/messages
Socket: Broadcast to group_:groupId room
```

#### Test 7.3: Add Member to Group
```
Goal: Invite new member to existing group
Steps:
1. Group admin opens settings
2. Click "Add Members"
3. Select Diana
4. Add

Expected:
- Diana added to group
- Diana can see message history
- Notification: "Alice added Diana"
- Diana receives group invite

API: PUT /api/chat-enhanced/groups/:id/members
Requires: Admin role
```

---

### **Phase 8: Online Presence**

#### Test 8.1: Online Status
```
Goal: See who's online
Steps:
1. Alice is online (green dot)
2. Bob logs out
3. Alice sees Bob go offline (gray dot)
4. Bob logs back in
5. Alice sees Bob online again

Expected:
- Green = online
- Yellow = away (idle 5+ min)
- Red = busy (manual status)
- Gray = offline
- Last seen timestamp when offline

Socket Events:
- user_online (on connection)
- user_offline (on disconnect)
- change_status (manual status change)

Storage: onlineUsers Map in server.js
```

#### Test 8.2: Custom Status
```
Goal: Set custom status message
Steps:
1. Click on own profile
2. Set status: "In a meeting"
3. Status: Busy (red)

Expected:
- Status visible to friends
- Shows in profile and chat list
- Updates in real-time for all friends
- Persists across reconnection

API: PUT /api/chat-enhanced/users/status
Socket Event: change_status (broadcast to friends)
```

---

### **Phase 9: Search & Discovery**

#### Test 9.1: Search Users
```
Goal: Find users to connect with
Steps:
1. Open user search
2. Search by:
   - Username: "alice"
   - Email: "alice@test.com"
3. View results

Expected:
- Matching users displayed
- Shows profile info
- "Add Friend" or "Already Friends" button
- Can view full profile

API: GET /api/chat-enhanced/users/search?q=alice
```

#### Test 9.2: Browse Communities
```
Goal: Discover public communities
Steps:
1. Go to Communities tab
2. Browse public communities
3. Filter by category
4. Search by tags

Expected:
- List of public communities
- Member count visible
- Categories: Programming, Science, Art, etc.
- Join button for non-members

API: GET /api/chat-enhanced/communities
```

---

### **Phase 10: Advanced Features**

#### Test 10.1: Message Threading
```
Goal: Create conversation thread
Steps:
1. Reply to message
2. Click "View Thread"
3. Thread sidebar opens
4. Continue conversation in thread

Expected:
- Thread shows all replies
- Original message at top
- Thread count shown on parent
- Can collapse/expand thread

Schema: DirectMessage.threadId
```

#### Test 10.2: User Mentions
```
Goal: Mention users in messages
Steps:
1. Type "@Bob" in message
2. Autocomplete shows Bob
3. Select Bob
4. Send message

Expected:
- Bob gets notification
- @mention highlighted in message
- Click mention to view profile
- Works in DMs, channels, groups

Schema: DirectMessage.mentions[]
```

#### Test 10.3: Pinned Messages
```
Goal: Pin important messages
Steps:
1. Admin/moderator hover over message
2. Click pin icon
3. Message pinned to top

Expected:
- Message stays at top of channel
- Unpin option available
- Shows "Pinned by Alice"
- Max 50 pinned messages

Schema: Channel.pinnedMessages[]
API: POST /api/chat-enhanced/channels/:id/pin
```

---

## 🔍 Debugging Tools

### Check Socket.IO Connection
```javascript
// In browser console
window.io?.engine?.readyState 
// Should return 'open'

// Check connected users
socket.emit('get_online_users')
```

### Monitor Network Requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: WS (WebSocket)
4. See Socket.IO messages in real-time
5. Check API calls under XHR
```

### Database Queries
```javascript
// Connect to MongoDB
mongosh

// Use EduKanban database
use edukanban

// Check friend requests
db.friendrequests.find().pretty()

// Check messages
db.directmessages.find().sort({ createdAt: -1 }).limit(10).pretty()

// Check communities
db.communities.find().pretty()

// Check files
db.fileattachments.find().pretty()

// Check online users (not in DB, in-memory Map)
```

### Server Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Or check terminal where server is running
# Shows API requests and Socket.IO events
```

---

## ✅ Testing Checklist

### Core Features:
- [ ] User registration & login
- [ ] Friend request send
- [ ] Friend request accept
- [ ] Friend request reject
- [ ] Send direct message
- [ ] Receive real-time message
- [ ] Typing indicator
- [ ] Read receipts
- [ ] Online/offline status
- [ ] Message reactions
- [ ] Reply to message
- [ ] Star message
- [ ] Delete message

### File Upload:
- [ ] Upload image (JPG/PNG)
- [ ] Upload PDF
- [ ] Upload Word document
- [ ] Upload video (MP4)
- [ ] Drag & drop upload
- [ ] Multiple file upload
- [ ] File download
- [ ] Thumbnail generation
- [ ] File size validation

### Communities:
- [ ] Create community
- [ ] Join community
- [ ] Leave community
- [ ] Create channel
- [ ] Send message in channel
- [ ] View community members
- [ ] Channel permissions
- [ ] Community search

### Groups:
- [ ] Create group
- [ ] Send message in group
- [ ] Add member to group
- [ ] Group notifications
- [ ] Group admin controls

### Search & Discovery:
- [ ] Search users
- [ ] Browse communities
- [ ] View user profiles
- [ ] Connection suggestions

### Real-time:
- [ ] Socket.IO connects
- [ ] Messages delivered instantly
- [ ] Typing indicators work
- [ ] Presence updates
- [ ] Reactions update live
- [ ] Friend status broadcasts

---

## 🐛 Common Issues & Solutions

### Issue: Socket.IO not connecting
```
Solution:
1. Check CORS settings in backend
2. Verify token is being sent
3. Check browser console for errors
4. Ensure backend is running on port 5001
```

### Issue: Files not uploading
```
Solution:
1. Check uploads/ directory exists
2. Verify file size < 100MB
3. Check mime type is allowed
4. Look for multer errors in backend logs
```

### Issue: Messages not appearing
```
Solution:
1. Check Socket.IO connection
2. Verify user is authenticated
3. Check MongoDB connection
4. Ensure conversation exists
```

### Issue: Friend requests not working
```
Solution:
1. Check user IDs are correct
2. Verify auth token is valid
3. Check API response in Network tab
4. Ensure no duplicate requests
```

---

## 📊 Performance Testing

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Test message sending
artillery quick --count 10 --num 100 http://localhost:5001/api/chat-enhanced/conversations/:id/messages
```

### Stress Testing
```
1. Create 100+ messages
2. Upload 10 files simultaneously
3. Join 20 communities
4. Test with 50+ concurrent users
```

---

## 🎉 Success Criteria

✅ All features work as expected
✅ Real-time updates < 1 second
✅ File uploads complete successfully
✅ No console errors
✅ UI is responsive
✅ Socket.IO stable connection
✅ Database queries optimized
✅ No memory leaks
✅ Mobile responsive

---

## 📝 Test Results

**Test Date**: _______________
**Tester**: _______________
**Pass Rate**: _____% (___ / ___ tests passed)

**Notes**:
```
Write any issues, bugs, or observations here
```

**Screenshots**:
```
Attach screenshots of successful tests
```

---

**Ready to test! 🚀**

Open http://localhost:3000 and start testing the most advanced chat system!
