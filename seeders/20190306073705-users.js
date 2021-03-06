'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
      { id: 1, username: 'user', password: 'user@rmi', role: 'user', email: 'rmi@example.com', created_at: new Date(), updated_at: new Date()},
      { id: 2, username: 'admin', password: 'admin@rmi', role: 'admin', email: 'rmi@example.com', created_at: new Date(), updated_at: new Date()},
      { id: 3, username: 'varun', password: 'varun@123', role: 'owner', email: 'varun@rmiinsights.com', created_at: new Date(), updated_at: new Date()},
      { id: 4, username: 'sylvester', password: 'sylvester@123', role: 'owner', email: 'varun@rmiinsights.com', created_at: new Date(), updated_at: new Date()}

    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};
