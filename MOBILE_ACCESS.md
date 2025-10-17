# Mobile Access Troubleshooting Guide

## ✅ Configuration Applied

The app is now configured to automatically detect the hostname and use the correct backend URL, whether you're accessing from:
- Desktop: `http://localhost:3000`
- Mobile: `http://192.168.1.13:3000`
- Other device: `http://YOUR_IP:3000`

## 🔍 How It Works

When you access the frontend from any device, it automatically uses the same hostname for the backend:
- Frontend on `http://localhost:3000` → Backend at `http://localhost:5001`
- Frontend on `http://192.168.1.13:3000` → Backend at `http://192.168.1.13:5001`

## 📱 Steps to Test Mobile Access

1. **Restart the development server** (important!):
   ```bash
   cd /Users/hema/WorkSpace/Software/EduKanban/frontend
   npm run dev
   ```

2. **Check the console output** - You should see:
   ```
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.13:3000/
   ```

3. **Access from mobile**:
   - Open browser on your mobile device
   - Go to: `http://192.168.1.13:3000`

4. **Open browser console** (for debugging):
   - You should see API configuration logs showing the correct URLs

## 🐛 Troubleshooting

### Issue: Can see the page but can't login/register

**Solution Applied**: ✅ The API configuration now automatically uses the network IP

**Verify**:
1. Open browser console on mobile (if possible)
2. Look for "🔧 EduKanban API Configuration" logs
3. Verify it shows: `API Base URL: http://192.168.1.13:5001/api`

### Issue: "Network Error" or "Cannot connect"

**Check these**:

1. **Backend is running**:
   ```bash
   cd /Users/hema/WorkSpace/Software/EduKanban/backend
   npm run dev
   ```
   Should show: `🚀 Server running on port 5001`

2. **Firewall is not blocking**:
   - macOS: System Preferences → Security & Privacy → Firewall
   - Make sure Node.js is allowed
   
3. **Both devices on same WiFi**:
   - Check your mobile WiFi settings
   - Should be connected to the same network as your computer

4. **Test backend directly from mobile**:
   - Open mobile browser
   - Go to: `http://192.168.1.13:5001/api/health` (if health endpoint exists)
   - Or: `http://192.168.1.13:5001/api/auth/` 
   - Should see JSON response (not error page)

### Issue: CORS Error

**Already fixed**: ✅ Backend now accepts connections from local network IPs

**If still occurring**:
- Check backend console for CORS errors
- Verify the backend CORS configuration in `backend/server.js`

## 📊 Debugging Commands

### Check if backend port is open:
```bash
# From your computer
lsof -i :5001

# Should show Node.js process listening on port 5001
```

### Test backend from another terminal:
```bash
# Should work from your computer
curl http://192.168.1.13:5001/api/

# If this works but mobile doesn't, it's likely a firewall issue
```

### Check your local IP again:
```bash
./get-network-ip.sh
```

## 🎯 Next Steps After Fix

1. **Restart the frontend server** (this is crucial!)
2. **Clear mobile browser cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Safari: Settings → Safari → Clear History and Website Data
3. **Try accessing again from mobile**: `http://192.168.1.13:3000`
4. **Test login/registration**

## 💡 Pro Tips

- **Use Chrome on mobile** for better debugging tools
- **Enable "Desktop site" mode** if mobile view has issues
- **Check mobile browser console** for detailed error messages
- **Restart both servers** if you make configuration changes

## ✨ What Should Work Now

- ✅ View the landing page on mobile
- ✅ Create new account from mobile
- ✅ Login from mobile
- ✅ Use all features (Kanban, courses, etc.)
- ✅ Real-time updates via Socket.IO
- ✅ Full responsive design

If you're still having issues after restarting the server, check the browser console for specific error messages!
