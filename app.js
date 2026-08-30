import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../src/routes/auth_routes.js";
import patientRouter from "../src/routes/patient_routes.js"
import doctorRouter from '../src/routes/doctor_routes.js'
import cors from "cors";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({ 
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/auth', authRouter);
app.use('/patients', patientRouter);
app.use('/doctors', doctorRouter);



export default app;
