const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { submitProgressLog, getProgressLogs, getProgressLogById } = require("../controllers/progress.controller");

const router = express.Router();

router.post("/", authMiddleware, submitProgressLog);
router.get("/", authMiddleware, getProgressLogs);
router.get("/:id", authMiddleware, getProgressLogById);

module.exports = router;
