'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      developerId: { type: Sequelize.UUID, allowNull: false, references: { model: 'carbon_developers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      projectCode: { type: Sequelize.STRING(100), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      projectType: { type: Sequelize.STRING(100), allowNull: false },
      category: { type: Sequelize.STRING(100), allowNull: true },
      methodology: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'active', 'under_review', 'validated', 'archived'), defaultValue: 'draft', allowNull: false },
      country: { type: Sequelize.STRING(100), allowNull: true },
      stateRegion: { type: Sequelize.STRING(100), allowNull: true },
      district: { type: Sequelize.STRING(100), allowNull: true },
      cityVillage: { type: Sequelize.STRING(100), allowNull: true },
      addressDescription: { type: Sequelize.TEXT, allowNull: true },
      latitude: { type: Sequelize.DOUBLE, allowNull: true },
      longitude: { type: Sequelize.DOUBLE, allowNull: true },
      startDate: { type: Sequelize.DATEONLY, allowNull: true },
      expectedDurationYears: { type: Sequelize.INTEGER, allowNull: true },
      projectAreaHa: { type: Sequelize.DOUBLE, allowNull: true },
      estimatedAnnualCO2Tonnes: { type: Sequelize.DOUBLE, allowNull: true },
      expectedCarbonCredits: { type: Sequelize.DOUBLE, allowNull: true },
      targetCertification: { type: Sequelize.STRING(255), allowNull: true },
      monitoringFrequency: { type: Sequelize.STRING(100), allowNull: true },
      additionalNotes: { type: Sequelize.TEXT, allowNull: true },
      participantCount: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      hasGIS: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('projects', ['developerId']);
    await queryInterface.addIndex('projects', ['status']);
    await queryInterface.addIndex('projects', ['projectType']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('projects');
  },
};
