const User = require("../models/user.model");
const Plan = require("../models/plan.model");
const ProgressLog = require("../models/progress-log.model");
const Feedback = require("../models/feedback.model");
const { sequelize } = require("../config/database/sequelize.config");

const getClientDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      res.status(403).json({ message: "Only clients can access client dashboard" });
      return;
    }

    // Get latest weight
    const latestLog = await ProgressLog.findOne({
      where: { clientId: req.user.id },
      order: [["weekStartDate", "DESC"]],
      attributes: ["weight", "status", "weekStartDate"],
    });

    // Get last submission status
    const lastSubmission = latestLog
      ? {
          status: latestLog.status,
          weekStartDate: latestLog.weekStartDate,
          weight: latestLog.weight,
        }
      : null;

    // Get weight trend (last 10 logs)
    const weightTrend = await ProgressLog.findAll({
      where: { clientId: req.user.id },
      attributes: ["weekStartDate", "weight", "mealAdherence", "workoutCompletion"],
      order: [["weekStartDate", "ASC"]],
      limit: 10,
    });

    // Get current plan
    const currentPlan = await Plan.findOne({
      where: { clientId: req.user.id, isActive: true },
      attributes: ["id", "dietText", "workoutText", "createdAt"],
    });

    res.status(200).json({
      latestWeight: latestLog?.weight || null,
      lastSubmission,
      weightTrend,
      currentPlan,
    });
  } catch (error) {
    next(error);
  }
};

const getCoachDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can access coach dashboard" });
      return;
    }

    // Get client list with stats using raw SQL - Sequelize uses camelCase
    const clients = await sequelize.query(
      `SELECT 
        u.id,
        u."firstName" as "first_name",
        u."lastName" as "last_name",
        u.email,
        u.status,
        COUNT(DISTINCT p.id) as "planCount",
        COALESCE(AVG(pl."mealAdherence"), 0) as "avgMealAdherence",
        COALESCE(AVG(pl."workoutCompletion"), 0) as "avgWorkoutCompletion",
        MAX(pl.weight) as "maxWeight",
        MIN(pl.weight) as "minWeight",
        MAX(pl."weekStartDate") as "lastLogDate"
       FROM users u
       INNER JOIN plans p ON p."clientId" = u.id
       LEFT JOIN "progress_logs" pl ON pl."clientId" = u.id
       WHERE p."coachId" = :coachId
       GROUP BY u.id, u."firstName", u."lastName", u.email, u.status
       ORDER BY u."createdAt" DESC`,
      {
        replacements: { coachId: req.user.id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Get weight trends per client (last 5 logs per client)
    const weightTrends = {};
    if (clients && clients.length > 0) {
      for (const client of clients) {
        try {
          const trends = await sequelize.query(
            `SELECT "weekStartDate" as week_start_date, weight, "mealAdherence" as meal_adherence, "workoutCompletion" as workout_completion
             FROM "progress_logs"
             WHERE "clientId" = :clientId
             ORDER BY "weekStartDate" DESC
             LIMIT 5`,
            {
              replacements: { clientId: client.id },
              type: sequelize.QueryTypes.SELECT,
            }
          );
          weightTrends[client.id] = trends ? trends.reverse() : []; // Reverse to show chronological order
        } catch (err) {
          weightTrends[client.id] = [];
        }
      }
    }

    // Get pending logs count
    const pendingLogsResult = await sequelize.query(
      `SELECT COUNT(*)::int as count
       FROM "progress_logs" pl
       INNER JOIN plans p ON p."clientId" = pl."clientId"
       WHERE p."coachId" = :coachId AND pl.status = 'submitted'`,
      {
        replacements: { coachId: req.user.id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      clients: clients || [],
      weightTrends,
      pendingLogsCount: pendingLogsResult && pendingLogsResult.length > 0 ? parseInt(pendingLogsResult[0].count || 0) : 0,
    });
  } catch (error) {
    console.error("Coach dashboard error:", error);
    next(error);
  }
};

module.exports = {
  getClientDashboard,
  getCoachDashboard,
};
