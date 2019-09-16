'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('statement', 'documentUUID', Sequelize.STRING)
    .then((() => {
      return queryInterface.addColumn('statement', 'companyUUID', Sequelize.STRING)
    }))
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('statement', 'documentUUID')
    .then((() => {
      return queryInterface.removeColumn('statement', 'companyUUID')
    }))
  }
};
