# AI Chatbot with Rate Limiter (Vercel AI SDK + Express)

This project is an **AI-powered chatbot** built with **Vercel AI SDK** and **Node.js/Express**, designed for company websites.  
To control **AI usage costs**, a **rate limiter** is implemented with different limits based on user type.

---

## 🚀 Features
- ✅ AI chatbot integration with [Vercel AI SDK](https://sdk.vercel.ai/)  
- ✅ Fixed Window **rate limiting (1-hour windows)**  
- ✅ User-based limits:
  - **Guest users:** 3 requests/hour
  - **Free users:** 10 requests/hour
  - **Premium users:** 50 requests/hour  
- ✅ Track by **User ID (logged in)** or **IP address (guests)**  
- ✅ Saves costs by **checking limits before calling AI**  
- ✅ Clear JSON error responses when limits are exceeded  

---

## 📂 Project Structure
```
.
├── api/
│   ├── chat.js        # POST /api/chat → AI responses (rate limited)
│   ├── login.js       # POST /api/login → Issue mock tokens
│   └── status.js      # GET /api/status → Show remaining requests
├── package.json
└── README.md
```

---

## ⚙️ Installation

```bash
# Clone repository
git clone https://github.com/Sahadat20/ai-chatbot.git
cd ai-chatbot

# Install dependencies
npm install
```

---

## ▶️ Running the Project

```bash
npm start
```

The API will be available at:

```
http://localhost:3000/
```

---

## 🔑 API Endpoints

### **1. POST /login**
Simulates login and returns a mock JWT with `userType`.

```json
// Request
{
  "username": "free_user",  //  "free_user" | "pro_user"
  "password": "password" 
}
// Response
{
  "token": "mock-jwt-token"
}
```

---

### **2. POST /chat** (Rate Limited)
Send a message to the AI.  
Rate limiter checks **before** calling the AI.

```json
// Request
{
  "message": "Hello AI!"
}

// Success Response
{
  "success": true,
  "message": "AI response here...",
  "remaining_requests": 7
}

// Rate Limit Exceeded Response
{
  "success": false,
  "error": "Too many requests. Free users can make 10 requests per hour.",
  "remaining_requests": 0
}
```

---

### **3. GET /status**
Check remaining requests in the current window.

```json
{
  "userType": "free",
  "remaining_requests": 5,
  "reset_time": "2025-09-02T11:00:00.000Z"
}
```

---

## 🛠️ Implementation Notes
- **Rate Limiting Strategy:** Fixed Window (1 hour)  
- **Storage:** In-memory object (can be replaced with Redis for production)  
- **Tracking:**  
  - Logged-in users → `userId` from JWT  
  - Guests → `req.ip`  

---

## 🧪 Example Test Flow

1. **Guest User**
   - Call `/chat` 3 times → ✅ works  
   - 4th call → ❌ returns error  

2. **Free User**
   - Call `/login` with `userType=free` → get token  
   - Call `/chat` with token 10 times → ✅ works  
   - 11th call → ❌ rate limit error  

3. **Premium User**
   - Same flow but allows 50 calls/hour  

---


