module.exports = (sequelize, DataTypes) => {
    const SignUp = sequelize.define(
        "SignUp",
        {
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isAlpha: true,
                },
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isAlpha: true,
                },
            },
            // countryCode: {
            //     type: DataTypes.STRING,
            //     allowNull: false,
            //     validate: {
            //         notEmpty: true,
            //         len: [1, 5],
            //     },
            // },
            country: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phoneNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                    isNumeric: true,
                },
            },
            zone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            church: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            verificationCode: {
                type: DataTypes.STRING,
                allowNull: false, 
            },
            verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false, 
            },

        },
        {
            timestamps: true,
            freezeTableName: true,
        }
    );

    SignUp.associate = (models) => {
        // A user (SignUp) can have many comments
        SignUp.hasMany(models.Comment, {
            foreignKey: "userId", // Define the foreign key
            as: "comments", // Alias for the association
        });
    };

    return SignUp;
};
