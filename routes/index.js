import { Router } from "express";
import authV1 from "./v1/auth/routes.js";
import userV1 from "./v1/user/routes.js";

const router = Router();

// Versioned routes
router.use("/v1/auth", authV1);
router.use("/v1/users", userV1);

export default router;
