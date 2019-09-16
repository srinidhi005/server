'use strict';
module.exports = (sequelize, DataTypes) => {
  const statement = sequelize.define('statement', {
    company: DataTypes.STRING,
    period: DataTypes.STRING,
    status: DataTypes.STRING,
    companyUUID: DataTypes.STRING,
    documentUUID: DataTypes.STRING,
    filename: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'statement',
  })    
  
  statement.associate = function (models) {
    statement.belongsTo(models.users, {foreignKey: 'user_id'});
  }
  
  return statement;
};