#!/bin/bash

# Get Network IP Address Script for EduKanban

echo "🌐 EduKanban Network Access Information"
echo "========================================"
echo ""

# Get the local IP address (macOS)
if command -v ifconfig &> /dev/null; then
    # macOS/Linux with ifconfig
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
elif command -v ip &> /dev/null; then
    # Linux with ip command
    LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -n 1)
else
    echo "❌ Cannot detect IP address automatically"
    echo "Please find your local IP manually:"
    echo "  - macOS: System Preferences → Network"
    echo "  - Windows: ipconfig in Command Prompt"
    echo "  - Linux: ip addr or ifconfig"
    exit 1
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not find local network IP"
    echo "Please ensure you are connected to a network"
    exit 1
fi

echo "📱 Your Local Network IP: $LOCAL_IP"
echo ""
echo "🖥️  Desktop Access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo ""
echo "📱 Mobile/Tablet Access (same network):"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend:  http://$LOCAL_IP:5001"
echo ""
echo "📝 Instructions for Mobile Access:"
echo "   1. Ensure your mobile device is on the same WiFi network"
echo "   2. Open a browser on your mobile device"
echo "   3. Navigate to: http://$LOCAL_IP:3000"
echo ""
echo "⚠️  Note: Make sure your firewall allows connections on ports 3000 and 5001"
echo ""
echo "🔧 To allow firewall access (macOS):"
echo "   System Preferences → Security & Privacy → Firewall → Firewall Options"
echo "   Allow Node.js and other applications to accept incoming connections"
echo ""
