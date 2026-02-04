const User = require("../models/user.model");
const Plan = require("../models/plan.model");
const ProgressLog = require("../models/progress-log.model");
const Feedback = require("../models/feedback.model");
const { ValidationError } = require("sequelize");
const { sequelize } = require("../config/database/sequelize.config");

const getPendingClients = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can view pending clients" });
      return;
    }

    // Use raw SQL for efficiency - Sequelize uses camelCase with quotes
    const clients = await sequelize.query(
      `SELECT u.id, u."firstName" as first_name, u."lastName" as last_name, u.email, u.status, u."createdAt" as created_at
       FROM users u
       WHERE u.role = 'client' AND u.status = 'pending'
       ORDER BY u."createdAt" DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.status(200).json(clients || []);
  } catch (error) {
    console.error("Get pending clients error:", error);
    next(error);
  }
};

const approveClient = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can approve clients" });
      return;
    }

    const { clientId } = req.params;

    // Use Sequelize for user input to prevent SQL injection
    const client = await User.findOne({
      where: { id: clientId, role: "client" },
    });

    if (!client) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    // Randomly assign a coach if not already assigned
    const existingPlan = await Plan.findOne({ where: { clientId } });
    if (!existingPlan) {
      // Get random active coach
      const coaches = await sequelize.query(
        `SELECT id FROM users WHERE role = 'coach' AND status = 'active' ORDER BY RANDOM() LIMIT 1`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (coaches && coaches.length > 0) {
        const randomCoachId = coaches[0].id;
        // Create a default plan (coach can update later)
        await Plan.create({
          coachId: randomCoachId,
          clientId: client.id,
          dietText: "Your personalized diet plan will be created by your coach.",
          workoutText: "Your personalized workout plan will be created by your coach.",
          isActive: true,
        });
      }
    }

    client.status = "active";
    await client.save();

    res.status(200).json({ message: "Client approved successfully", client });
  } catch (error) {
    next(error);
  }
};

const rejectClient = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can reject clients" });
      return;
    }

    const { clientId } = req.params;

    // Use Sequelize for user input to prevent SQL injection
    const client = await User.findOne({
      where: { id: clientId, role: "client" },
    });

    if (!client) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    client.status = "rejected";
    await client.save();

    res.status(200).json({ message: "Client rejected", client });
  } catch (error) {
    next(error);
  }
};

const getMyClients = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can view their clients" });
      return;
    }

    // Use raw SQL for complex query - Sequelize uses camelCase
    const clients = await sequelize.query(
      `SELECT DISTINCT u.id, u."firstName" as first_name, u."lastName" as last_name, u.email, u.status, u."createdAt" as created_at,
              COUNT(DISTINCT p.id) as "planCount",
              COUNT(DISTINCT pl.id) as "logCount"
       FROM users u
       INNER JOIN plans p ON p."clientId" = u.id
       LEFT JOIN "progress_logs" pl ON pl."clientId" = u.id
       WHERE p."coachId" = :coachId
       GROUP BY u.id, u."firstName", u."lastName", u.email, u.status, u."createdAt"
       ORDER BY u."createdAt" DESC`,
      {
        replacements: { coachId: req.user.id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

const reviewProgressLog = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can review progress logs" });
      return;
    }

    const { logId } = req.params;
    const { action, feedback } = req.body; // action: "approve" or "reject"

    // Verify this log belongs to coach's client - Sequelize uses camelCase
    const logResults = await sequelize.query(
      `SELECT pl.* FROM "progress_logs" pl
       INNER JOIN plans p ON p."clientId" = pl."clientId"
       WHERE pl.id = :logId AND p."coachId" = :coachId`,
      {
        replacements: { logId, coachId: req.user.id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!logResults || logResults.length === 0) {
      res.status(404).json({ message: "Progress log not found or not authorized" });
      return;
    }

    const progressLog = await ProgressLog.findByPk(logId);

    if (action === "approve") {
      progressLog.status = "approved";
      await progressLog.save();

      // Delete existing feedback if any
      await Feedback.destroy({ where: { progressLogId } });

      res.status(200).json({ message: "Progress log approved", progressLog });
    } else if (action === "reject") {
      if (!feedback) {
        res.status(422).json({ message: "Feedback is required when rejecting" });
        return;
      }

      progressLog.status = "rejected";
      await progressLog.save();

      // Create or update feedback
      const [existingFeedback] = await Feedback.findOrCreate({
        where: { progressLogId },
        defaults: {
          progressLogId,
          coachId: req.user.id,
          feedback,
        },
      });

      if (!existingFeedback[1]) {
        // Update existing feedback
        existingFeedback[0].feedback = feedback;
        await existingFeedback[0].save();
      }

      res.status(200).json({
        message: "Progress log rejected with feedback",
        progressLog,
        feedback: existingFeedback[0],
      });
    } else {
      res.status(422).json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      const errorMessages = error.errors.map((err) => err.message);
      res.status(422).json({
        status: "fail",
        message: "Validation Error",
        errors: errorMessages,
      });
      return;
    }
    next(error);
  }
};

module.exports = {
  getPendingClients,
  approveClient,
  rejectClient,
  getMyClients,
  reviewProgressLog,
};
