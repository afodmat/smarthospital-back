import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth_routes1.js";
import patientRouter from "../src/routes/patient_routes.js"
import doctorRouter from '../src/routes/doctor_routes.js';
import adminRouter from '../src/routes/admin_routes.js';
import appointmentRouter from '../src/routes/appointment_routes.js';
import reportRouter from './routes/report_routes.js';
import cors from "cors";
import dotenv from  'dotenv';

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://smart-hospitalsystem.netlify.app",
];

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
app.use('/admins', adminRouter);
app.use('/appointments', appointmentRouter);
app.use('/reports', reportRouter);




export default app;
