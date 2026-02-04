const User = require("../../models/user.model");
const Plan = require("../../models/plan.model");
const ProgressLog = require("../../models/progress-log.model");
const Feedback = require("../../models/feedback.model");

const setupAssociations = () => {
  // Coach has many Plans
  Plan.belongsTo(User, { foreignKey: "coachId", as: "coach" });
  User.hasMany(Plan, { foreignKey: "coachId", as: "coachPlans" });

  // Client has many Plans (assigned plans)
  Plan.belongsTo(User, { foreignKey: "clientId", as: "client" });
  User.hasMany(Plan, { foreignKey: "clientId", as: "clientPlans" });

  // Client has many ProgressLogs
  ProgressLog.belongsTo(User, { foreignKey: "clientId", as: "client" });
  User.hasMany(ProgressLog, { foreignKey: "clientId", as: "progressLogs" });

  // ProgressLog has one Feedback
  Feedback.belongsTo(ProgressLog, { foreignKey: "progressLogId", as: "progressLog" });
  ProgressLog.hasOne(Feedback, { foreignKey: "progressLogId", as: "feedback" });

  // Coach can give feedback (optional - feedback can be created by coach)
  Feedback.belongsTo(User, { foreignKey: "coachId", as: "coach" });
  User.hasMany(Feedback, { foreignKey: "coachId", as: "feedbacks" });
};

module.exports = { setupAssociations };
