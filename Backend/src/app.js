const path = require("path");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

require("dotenv").config();
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/usersRoutes");
const quizRoutes = require("../routes/quizRoutes");
const organisationRoutes = require("../routes/organisationRoutes");
const gameSessionRoutes = require("../routes/gameSessionRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const socketMiddleware = require("../middlewares/socketMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Secrurity
app.use(helmet());

//No CORS for images
app.use(
  "/avatars",
  (req, res, next) => {
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../public/avatars")),
);

//No CORS for logos
app.use(
  "/logos",
  (req, res, next) => {
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../public/logos")),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:9000",
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "QuizzFiesta API is running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      user: "/api/user",
      quiz: "/api/quiz",
      organisation: "/api/organisation",
    },
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "I'm Okay!",
  });
});

//****ROUTES****//
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/organisation", organisationRoutes);
app.use("/api/session", socketMiddleware, gameSessionRoutes);
app.use("/api/payment", paymentRoutes);

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
