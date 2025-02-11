module.exports = (sequelize, DataTypes) => {
const Attendance = sequelize.define("Attendance", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  groupParticipation: {
    type: DataTypes.STRING,
    allowNull: true,
    // defaultValue: DataTypes.STRING,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
Attendance.associate = (models) => {
    // Attendance of user (SignUp)
    Attendance.belongsTo(models.SignUp, {
        foreignKey: "userId", // Define the foreign key
        as: "user", // Alias for the association
    });
};

return Attendance;
}