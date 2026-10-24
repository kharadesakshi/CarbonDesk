'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add locationCoordinates and plotReference to measurements if they don't already exist
    const measurementsTable = await queryInterface.describeTable('measurements');
    if (!measurementsTable.locationCoordinates) {
      await queryInterface.addColumn('measurements', 'locationCoordinates', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!measurementsTable.plotReference) {
      await queryInterface.addColumn('measurements', 'plotReference', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // 2. Check if mrv_evidence table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('mrv_evidence')) {
      await queryInterface.createTable('mrv_evidence', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        projectId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'projects', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        mrvCycleId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'mrv_cycles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        measurementId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'measurements', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        documentId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'documents', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        evidenceType: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 'Field Observation',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        uploadedById: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'carbon_developers', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      await queryInterface.addIndex('mrv_evidence', ['projectId']);
      await queryInterface.addIndex('mrv_evidence', ['mrvCycleId']);
      await queryInterface.addIndex('mrv_evidence', ['measurementId']);
      await queryInterface.addIndex('mrv_evidence', ['documentId']);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mrv_evidence', { cascade: true });
    await queryInterface.removeColumn('measurements', 'locationCoordinates');
    await queryInterface.removeColumn('measurements', 'plotReference');
  },
};
