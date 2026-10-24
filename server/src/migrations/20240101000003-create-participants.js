'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('participants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      projectId: { type: Sequelize.UUID, allowNull: false, references: { model: 'projects', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      participantCode: { type: Sequelize.STRING(100), allowNull: true },
      fullName: { type: Sequelize.STRING(255), allowNull: false },
      participantType: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'Individual Farmer' },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(50), allowNull: true },
      village: { type: Sequelize.STRING(100), allowNull: true },
      district: { type: Sequelize.STRING(100), allowNull: true },
      stateRegion: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      plotId: { type: Sequelize.STRING(100), allowNull: true },
      plotAreaHa: { type: Sequelize.DOUBLE, allowNull: true },
      plotDescription: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive', 'pending'), defaultValue: 'pending', allowNull: false },
      enrollmentDate: { type: Sequelize.DATEONLY, allowNull: true },
      consentGiven: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      consentDate: { type: Sequelize.DATEONLY, allowNull: true },
      additionalNotes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('participants', ['projectId']);
    await queryInterface.addIndex('participants', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('participants');
  },
};
