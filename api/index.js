/* =========================================================
   🚀 E-LAUNDRY GOD-MODE ULTRA SERVER (PRODUCTION READY)
   ========================================================= */

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

/* =========================================================
   🔥 ENV VALIDATION (CRASH IF MISSING)
   ========================================================= */

const REQUIRED_ENVS = ["MONGO_URL", "PORT"];
REQUIRED_ENVS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ FATAL ERROR: ${key} missing in .env`);
    process.exit(1);
  }
});

/* =========================================================
   🚀 APP INITIALIZATION
   ========================================================= */

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

/* =========================================================
   🛡 SECURITY + PERFORMANCE MIDDLEWARE
   ========================================================= */

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(morgan("tiny"));

/* =========================================================
   🌍 DYNAMIC CORS SYSTEM (DEPLOY SAFE)
   ========================================================= */

const RAW_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.SECOND_FRONTEND_URL,
  process.env.THIRD_FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const sanitizeOrigin = (origin) => {
  if (!origin) return "";
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return origin.replace(/\/$/, "");
  }
};

const ALLOWED_ORIGINS = Array.from(
  new Set(RAW_ORIGINS.map((o) => sanitizeOrigin(o)).filter(Boolean))
);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const clean = sanitizeOrigin(origin);
    if (ALLOWED_ORIGINS.includes(clean)) {
      return cb(null, true);
    }

    console.log("❌ CORS Blocked:", origin);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Access-Token",
    "X-Auth-Token",
  ],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* =========================================================
   🧠 CACHE + NO STORE POLICY
   ========================================================= */

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/* =========================================================
   ⏳ REQUEST TIMEOUT PROTECTION
   ========================================================= */

app.use((req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request Timeout" });
    }
  }, 20000);

  res.on("finish", () => clearTimeout(timer));
  next();
});

/* =========================================================
   🗄 MONGODB CONNECTION (POOL OPTIMIZED)
   ========================================================= */

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URL, {
        maxPoolSize: 100,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 120000,
        family: 4,
        autoIndex: false,
      })
      .then((db) => {
        console.log("✅ MongoDB Connected");
        return db;
      })
      .catch((err) => {
        console.error("❌ MongoDB Failed:", err.message);
        process.exit(1);
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

mongoose.connection.on("disconnected", () =>
  console.warn("⚠ MongoDB Disconnected")
);
mongoose.connection.on("reconnected", () =>
  console.log("🔄 MongoDB Reconnected")
);
mongoose.connection.on("error", (err) =>
  console.error("Mongo Error:", err.message)
);

/* =========================================================
   🛣 ROUTES
   ========================================================= */

const authrouter = require("../router/AuthRoute.js");
const itemrouter = require("../router/ItemRoute.js");
const superrouter = require("../router/SuperRoute.js");
const shoprouter = require("../router/Shoproute.js");
const cartrouter = require("../router/CartRoute.js");
const orderrouter = require("../router/OrderRoute.js");
const reviewrouter = require("../router/ReviewRoute.js");

app.get("/ping", (req, res) => res.send("Pong"));
app.get("/", (req, res) =>
  res.status(200).json("Welcome to e-laundry backend system")
);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    time: new Date(),
    allowedOrigins: ALLOWED_ORIGINS,
  });
});

app.use("/auth", authrouter);
app.use("/sup", superrouter);
app.use("/item", itemrouter);
app.use("/shop", shoprouter);
app.use("/cart", cartrouter);
app.use("/order", orderrouter);
app.use("/review", reviewrouter);

/* =========================================================
   🔌 SOCKET.IO (REALTIME ORDER SYSTEM READY)
   ========================================================= */

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 35000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("join_room", (roomid) => socket.join(roomid));
  socket.on("leave_room", (roomid) => socket.leave(roomid));

  socket.on("new_order", (data) =>
    io.to(data.shopid).emit("order_received", data)
  );

  socket.on("order_status_update", (data) =>
    io.to(data.userid).emit("order_status_changed", data)
  );

  socket.on("disconnect", (reason) =>
    console.log("Socket Disconnected:", reason)
  );
});

/* =========================================================
   ❌ GLOBAL ERROR HANDLER
   ========================================================= */

app.use((err, req, res, next) => {
  void next;
  console.error("Server Error:", err.stack || err);
  if (!res.headersSent)
    res.status(500).json({ message: "Internal Server Error" });
});

/* =========================================================
   🚀 START SERVER
   ========================================================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 E-Laundry Server Running On Port ${PORT}`);
  console.log("🌍 Allowed Origins:", ALLOWED_ORIGINS);
});

connectDB().catch((err) =>
  console.error("Mongo Async Connection Failed:", err)
);

server.keepAliveTimeout = 70000;
server.headersTimeout = 71000;