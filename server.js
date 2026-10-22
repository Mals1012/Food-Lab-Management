const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const batchRoutes = require("./routes/batchRoutes");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const auditRoutes = require("./routes/auditRoutes");
const manualTestRoutes = require("./routes/manualTestRoutes");

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/manual-tests", manualTestRoutes);
app.use("/api/audit-logs", auditRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Food Processing Laboratory Management System API is running"
    });
});

// Serve frontend static production build
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// Single Page Application (SPA) fallback: serve index.html for all non-API GET routes
app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
        return res.sendFile(path.join(frontendDist, "index.html"));
    }
    next();
});

const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`   FOOD LAB MANAGEMENT SYSTEM IS FULLY ONLINE    `);
        console.log(`   Unified URL: http://localhost:${PORT}        `);
        console.log(`=================================================`);
    });
};

startServer();