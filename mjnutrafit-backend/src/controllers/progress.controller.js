const ProgressLog = require("../models/progress-log.model");
const Feedback = require("../models/feedback.model");
const User = require("../models/user.model");
const Plan = require("../models/plan.model");
const { ValidationError } = require("sequelize");
const { sequelize } = require("../config/database/sequelize.config");

const submitProgressLog = async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      res.status(403).json({ message: "Only clients can submit progress logs" });
      return;
    }

    if (req.user.status !== "active") {
      res.status(403).json({ message: "Your account must be approved by a coach first" });
      return;
    }

    const { weekStartDate, weight, mealAdherence, workoutCompletion, notes } = req.body;

    // Check if log already exists for this week
    const existingLog = await ProgressLog.findOne({
      where: {
        clientId: req.user.id,
        weekStartDate,
      },
    });

    if (existingLog) {
      res.status(422).json({ message: "Progress log for this week already exists" });
      return;
    }

    const progressLog = await ProgressLog.create({
      clientId: req.user.id,
      weekStartDate,
      weight,
      mealAdherence,
      workoutCompletion,
      notes: notes || null,
      status: "submitted",
    });

    res.status(201).json(progressLog);
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

const getProgressLogs = async (req, res, next) => {
  try {
    let logs;

    if (req.user.role === "coach") {
      // Coach sees logs from their clients - Sequelize uses camelCase
      const results = await sequelize.query(
        `SELECT pl.*, u."firstName" as "clientFirstName", u."lastName" as "clientLastName", u.email as "clientEmail"
         FROM "progress_logs" pl
         INNER JOIN plans p ON p."clientId" = pl."clientId"
         INNER JOIN users u ON u.id = pl."clientId"
         WHERE p."coachId" = :coachId
         ORDER BY pl."weekStartDate" DESC`,
        {
          replacements: { coachId: req.user.id },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      logs = results;
    } else {
      // Client sees their own logs
      logs = await ProgressLog.findAll({
        where: { clientId: req.user.id },
        include: [
          {
            model: Feedback,
            as: "feedback",
            include: [
              {
                model: User,
                as: "coach",
                attributes: ["id", "firstName", "lastName"],
              },
            ],
          },
        ],
        order: [["weekStartDate", "DESC"]],
      });
    }

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

const getProgressLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let log;

    if (req.user.role === "coach") {
      // Coach can see logs from their clients - Sequelize uses camelCase
      const results = await sequelize.query(
        `SELECT pl.*, u."firstName" as "clientFirstName", u."lastName" as "clientLastName", u.email as "clientEmail"
         FROM "progress_logs" pl
         INNER JOIN plans p ON p."clientId" = pl."clientId"
         INNER JOIN users u ON u.id = pl."clientId"
         WHERE pl.id = :logId AND p."coachId" = :coachId`,
        {
          replacements: { logId: id, coachId: req.user.id },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      log = results[0];
    } else {
      // Client sees their own log
      log = await ProgressLog.findOne({
        where: { id, clientId: req.user.id },
        include: [
          {
            model: Feedback,
            as: "feedback",
            include: [
              {
                model: User,
                as: "coach",
                attributes: ["id", "firstName", "lastName"],
              },
            ],
          },
        ],
      });
    }

    if (!log) {
      res.status(404).json({ message: "Progress log not found" });
      return;
    }

    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProgressLog,
  getProgressLogs,
  getProgressLogById,
};
