const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Item = sequelize.define(
  "Item",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quantityDisplay: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    lastUpdated: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { timestamps: true }
);

module.exports = Item;
