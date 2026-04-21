const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    action: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: false },
    userName: { type: DataTypes.STRING, allowNull: false },
  },
  { timestamps: true }
);

module.exports = ActivityLog;
