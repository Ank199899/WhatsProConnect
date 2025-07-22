# 🔧 TROUBLESHOOTING GUIDE

## 🎯 **CURRENT ISSUE: Sessions not showing in frontend**

### **✅ WHAT'S WORKING:**
- Backend: http://192.168.1.230:3006/api/sessions ✅
- Frontend: http://192.168.1.230:3007 ✅
- Sessions in database: 2 sessions ✅

### **❌ WHAT'S NOT WORKING:**
- Frontend not displaying sessions from backend

## 🔍 **DEBUGGING STEPS:**

### **1. Check Test Component:**
- Go to: http://192.168.1.230:3007
- Click "WhatsApp Numbers" tab
- Look at "Session Connection Test" section
- Check if sessions load there

### **2. Check Browser Console:**
- Press F12 in browser
- Go to Console tab
- Look for errors or API calls

### **3. Check Network Tab:**
- Press F12 → Network tab
- Reload page
- Look for API calls to port 3006

## 🚀 **QUICK FIXES:**

### **If CORS Error:**
```bash
# Backend needs CORS headers
# Already configured in server
```

### **If Network Error:**
```bash
# Check if backend is running
curl http://192.168.1.230:3006/api/sessions
```

### **If Frontend Error:**
```bash
# Restart frontend
pkill -f "next"
npm run dev -- -H 0.0.0.0 -p 3007
```

## 📱 **EXPECTED RESULT:**
Test component should show:
```
📱 Found 2 sessions:
- Business Number (ready)
- Personal Number (ready)
```

## 🎯 **NEXT STEPS:**
1. Check test component results
2. Report what you see
3. I'll fix the exact issue
