const Plan = require("../models/plan.model");
const User = require("../models/user.model");
const { ValidationError } = require("sequelize");
const { sequelize } = require("../config/database/sequelize.config");

const createPlan = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can create plans" });
      return;
    }

    const { clientId, dietText, workoutText } = req.body;

    // Use Sequelize for user input to prevent SQL injection
    const client = await User.findOne({ 
      where: { id: clientId, role: "client" } 
    });

    if (!client) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    // Deactivate previous active plans for this client
    await Plan.update(
      { isActive: false },
      { where: { clientId, isActive: true } }
    );

    const plan = await Plan.create({
      coachId: req.user.id,
      clientId,
      dietText,
      workoutText,
      isActive: true,
    });

    res.status(201).json(plan);
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

const getPlans = async (req, res, next) => {
  try {
    let plans;
    
    if (req.user.role === "coach") {
      // Coach sees all plans they created
      plans = await Plan.findAll({
        where: { coachId: req.user.id },
        include: [
          {
            model: User,
            as: "client",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Client sees their assigned plans
      plans = await Plan.findAll({
        where: { clientId: req.user.id },
        include: [
          {
            model: User,
            as: "coach",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
};

const getCurrentPlan = async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      res.status(403).json({ message: "Only clients can view current plan" });
      return;
    }

    const plan = await Plan.findOne({
      where: { clientId: req.user.id, isActive: true },
      include: [
        {
          model: User,
          as: "coach",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!plan) {
      res.status(404).json({ message: "No active plan found" });
      return;
    }

    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      res.status(403).json({ message: "Only coaches can update plans" });
      return;
    }

    const { id } = req.params;
    const { dietText, workoutText } = req.body;

    const plan = await Plan.findOne({
      where: { id, coachId: req.user.id },
    });

    if (!plan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    if (dietText) plan.dietText = dietText;
    if (workoutText) plan.workoutText = workoutText;

    await plan.save();

    res.status(200).json(plan);
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
  createPlan,
  getPlans,
  getCurrentPlan,
  updatePlan,
};
