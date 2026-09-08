import { connectDB, disconnectDB } from "./config/db.js";
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
async function startServer() {
    await connectDB();

  const server = http.createServer(app);

  app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer().catch((err) => {
  console.error("Error while starting the server", err);
  process.exit(1);
});
