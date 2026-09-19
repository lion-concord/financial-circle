import "dotenv/config";
import express from "express";
import authRouter from "./modules/auth/auth.router.js";
import usersRouter from "./modules/users/users.router.js";
import billingRouter from "./modules/billing/tariffs.router.js";
import subscriptionsRouter from "./modules/billing/subscriptions.router.js";
import paymentsRouter from "./modules/billing/payments.router.js";
import earningsRouter from "./modules/billing/earnings.router.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/", usersRouter);
app.use("/", billingRouter);
app.use("/", subscriptionsRouter);
app.use("/", paymentsRouter);
app.use("/", earningsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => console.log(`[server] listening on :${port}`));
