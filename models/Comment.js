module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define("Comment", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Ensure only logged-in users can comment
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Comment.associate = (models) => {
      // A comment belongs to a user (SignUp)
      Comment.belongsTo(models.SignUp, {
          foreignKey: "userId", // Define the foreign key
          as: "user", // Alias for the association
      });
  };

  return Comment;
};
