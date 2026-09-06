import { connectDB, disconnectDB } from "./config/db.js";
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";

dotenv.config();

async function startServer() {
    await connectDB();

  const server = http.createServer(app);

  server.listen(process.env.PORT, () => {
    console.log(`Server is now listening to port ${process.env.PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error while starting the server", err);
  process.exit(1);
});
