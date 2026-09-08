import app from "./src/app.js";
import { connectDb } from "./src/config/db.js";
import { env } from "./src/config/env.js";

await connectDb();

app.get("/", (req, res) => res.json({ ok: true, service: "BookFlow API" }));

app.listen(env.port, () =>
  console.log(`API listening on http://localhost:${env.port}`),
);
