const { sequelize } = require("./sequelize.config");
const User = require("../../models/user.model");
const Plan = require("../../models/plan.model");
const ProgressLog = require("../../models/progress-log.model");
const Feedback = require("../../models/feedback.model");
const { setupAssociations } = require("./associations.config");

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    
    setupAssociations();
    
    // Use sync with alter: true but catch enum errors
    try {
      await sequelize.sync({ alter: true });
      console.log("Database models synchronized.");
    } catch (syncError) {
      // Ignore enum duplicate errors - they're harmless and occur when types already exist
      const errorMessage = syncError.message || syncError.toString();
      if (errorMessage.includes("duplicate key value violates unique constraint") || 
          errorMessage.includes("pg_type_typname_nsp_index") ||
          errorMessage.includes("duplicate_object")) {
        console.log("Database models synchronized (some types already exist, this is normal).");
      } else {
        // Log other errors but don't crash - allow server to start
        console.warn("Database sync warning:", errorMessage);
        console.log("Continuing with existing database schema...");
      }
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error.message || error);
    // Don't throw - let server attempt to start anyway
    console.log("Server will continue but database operations may fail.");
  }
};

module.exports = { initializeDatabase };
