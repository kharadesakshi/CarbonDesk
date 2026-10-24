'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_gis', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      projectId: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'projects', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      centerLatitude: { type: Sequelize.DOUBLE, allowNull: true },
      centerLongitude: { type: Sequelize.DOUBLE, allowNull: true },
      boundaryGeoJSON: { type: Sequelize.TEXT, allowNull: true },
      calculatedAreaHa: { type: Sequelize.DOUBLE, allowNull: true },
      perimeterKm: { type: Sequelize.DOUBLE, allowNull: true },
      coordinateSystem: { type: Sequelize.STRING(50), allowNull: true, defaultValue: 'WGS84' },
      mapZoom: { type: Sequelize.DOUBLE, allowNull: true },
      lastEditedAt: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('project_gis', ['projectId'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('project_gis');
  },
};
