'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carbon_developers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      fullName: { type: Sequelize.STRING(200), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(50), allowNull: true },
      organizationName: { type: Sequelize.STRING(255), allowNull: true },
      organizationType: { type: Sequelize.STRING(100), allowNull: true },
      registrationNumber: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      profileStatus: { type: Sequelize.ENUM('active', 'inactive', 'pending_verification'), defaultValue: 'active', allowNull: false },
      bio: { type: Sequelize.TEXT, allowNull: true },
      website: { type: Sequelize.STRING(255), allowNull: true },
      kycStatus: { type: Sequelize.ENUM('not_started', 'pending', 'verified', 'rejected'), defaultValue: 'not_started', allowNull: false },
      kycSubmittedAt: { type: Sequelize.DATE, allowNull: true },
      kycVerifiedAt: { type: Sequelize.DATE, allowNull: true },
      lastLoginAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('carbon_developers', ['email'], { unique: true });
    await queryInterface.addIndex('carbon_developers', ['profileStatus']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('carbon_developers');
  },
};
