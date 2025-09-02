

const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const {google  } = require('@ai-sdk/google')
const {generateText   } = require('ai')


dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const rateLimitWindowMs =  60 * 1000; // 1 minute
const userTiers = {
  guest: { limit: 3 },
  free: { limit: 10},
  pro: { limit: 50},
};

// --- MOCK DATABASE ---
const mockUsers = [
  { id: 'user-free-123', username: 'free_user', password: 'password', tier: 'free' },
  { id: 'user-pro-456', username: 'pro_user', password: 'password', tier: 'pro' },
];
const requestTracker = {}; // { 'id': { count: Number, startTime: Timestamp } }

const app = express();

// Parse URL-encoded bodies for the /login route
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MIDDLEWARE ---
const rateLimitMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  const ip = req.socket.remoteAddress;
  const currentTime = Date.now();
  let userId;
  let userTier;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      userTier = userTiers[decoded.tier] || userTiers.guest;
    } catch (err) {
      userId = ip;
      userTier = userTiers.guest;
    }
  } else {
    userId = ip;
    userTier = userTiers.guest;
  }

  if (!requestTracker[userId]) {
    requestTracker[userId] = { count: 1, startTime: currentTime };
  } else {
    const windowData = requestTracker[userId];
    const timePassed = currentTime - windowData.startTime;
    if (timePassed < rateLimitWindowMs) {
      windowData.count++;
    } else {
      windowData.count = 1;
      windowData.startTime = currentTime;
    }
  }

  if (requestTracker[userId].count > userTier.limit) {
    return res.status(429).json({
    "success": false,
    "error": "Too many requests. Free users can make 10 requests per hour.",
    "remaining_requests": 0
    });
  }
  const remainingLimit = userTier.limit - requestTracker[userId].count;
  req.rateLimitInfo = {
    remainingLimit,
    limit: userTier.limit,
  };
  next();
};
const rateLimitStatusMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  const ip = req.socket.remoteAddress;
  const currentTime = Date.now();
  let userId;
  let userTier;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      userTier = userTiers[decoded.tier] || userTiers.guest;
    } catch (err) {
      userId = ip;
      userTier = userTiers.guest;
    }
  } else {
    userId = ip;
    userTier = userTiers.guest;
  }

  let remaining_requests_count = 0;
  if (!requestTracker[userId]) {
    remaining_requests_count = userTier.limit;
  } else {
    const windowData = requestTracker[userId];
    const timePassed = currentTime - windowData.startTime;
    if (timePassed < rateLimitWindowMs) {
       remaining_requests_count = userTier.limit - requestTracker[userId].count;
    } else {
      remaining_requests_count = userTier.limit;
    }
  }

  
  req.rateLimitInfo = {
    remaining_requests : remaining_requests_count
   
  };
  next();
};

// --- ROUTES ---
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id, tier: user.tier }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// get remaining requests count
app.get('/status', rateLimitStatusMiddleware , (req,res)=>{
    res.send(`remaining_requests: ${req.rateLimitInfo.remaining_requests}`);
    // res.json({"remaining_requests": req.rateLimitInfo.remainingLimit})
})



// Ai chat response  (has rate limiting)
app.post("/chat",rateLimitMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: message,
        });
    console.log(text);

    
    res.json({
        "success": true,
        "message": text,
        "remaining_requests": req.rateLimitInfo.remainingLimit
        });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Default response
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// const PORT = process.env.PORT || 5000;
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
