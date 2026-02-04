const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/sequelize.config");

class ProgressLog extends Model {}

ProgressLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    weekStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Weight must be positive",
        },
      },
    },
    mealAdherence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Meal adherence must be between 0 and 100",
        },
        max: {
          args: [100],
          msg: "Meal adherence must be between 0 and 100",
        },
      },
    },
    workoutCompletion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Workout completion must be between 0 and 100",
        },
        max: {
          args: [100],
          msg: "Workout completion must be between 0 and 100",
        },
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("submitted", "approved", "rejected"),
      allowNull: false,
      defaultValue: "submitted",
    },
  },
  {
    sequelize,
    tableName: "progress_logs",
    timestamps: true,
  }
);

module.exports = ProgressLog;
