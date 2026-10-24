'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      projectId: { type: Sequelize.UUID, allowNull: false, references: { model: 'projects', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      participantId: { type: Sequelize.UUID, allowNull: true, references: { model: 'participants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      uploadedById: { type: Sequelize.UUID, allowNull: false, references: { model: 'carbon_developers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      documentName: { type: Sequelize.STRING(255), allowNull: false },
      documentType: { type: Sequelize.STRING(100), allowNull: false },
      originalFileName: { type: Sequelize.STRING(255), allowNull: false },
      storageProvider: { type: Sequelize.ENUM('local', 's3'), allowNull: false },
      storagePath: { type: Sequelize.STRING(1000), allowNull: false },
      storageUrl: { type: Sequelize.STRING(2000), allowNull: true },
      fileSizeBytes: { type: Sequelize.BIGINT, allowNull: false },
      mimeType: { type: Sequelize.STRING(100), allowNull: false },
      verificationStatus: { type: Sequelize.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending', allowNull: false },
      verificationNotes: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('documents', ['projectId']);
    await queryInterface.addIndex('documents', ['participantId']);
    await queryInterface.addIndex('documents', ['uploadedById']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  },
};
