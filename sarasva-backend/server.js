import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import app from "./src/app.js";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Sarasva backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start();
