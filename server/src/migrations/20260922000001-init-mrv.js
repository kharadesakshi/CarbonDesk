'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create measurement_types table
    await queryInterface.createTable('measurement_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
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

    // Create mrv_cycles table
    await queryInterface.createTable('mrv_cycles', {
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
      cycleName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      cycleCode: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      monitoringStartDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      monitoringEndDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'draft',
          'data_collection',
          'data_submitted',
          'validation',
          'needs_correction',
          'validated',
          'report_generated',
          'submitted_for_verification',
          'under_verification',
          'verified',
          'rejected'
        ),
        defaultValue: 'draft',
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'carbon_developers', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      validatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Create measurements table
    await queryInterface.createTable('measurements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      mrvCycleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'mrv_cycles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      participantId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'participants', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      measurementTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'measurement_types', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      measurementDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      source: {
        type: Sequelize.ENUM('manual', 'field_survey', 'document', 'gis', 'satellite', 'iot', 'import', 'other'),
        defaultValue: 'manual',
        allowNull: false,
      },
      dataCategory: {
        type: Sequelize.ENUM('baseline', 'project', 'monitoring'),
        defaultValue: 'monitoring',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'valid', 'invalid', 'needs_correction'),
        defaultValue: 'draft',
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      validationNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      validatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      validatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'carbon_developers', key: 'id' },
        onDelete: 'SET NULL',
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

    // Create mrv_reports table
    await queryInterface.createTable('mrv_reports', {
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
      status: {
        type: Sequelize.ENUM('draft', 'generated', 'submitted', 'under_verification', 'verified', 'rejected'),
        defaultValue: 'draft',
        allowNull: false,
      },
      reportContent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totalMeasurements: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      validMeasurements: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      invalidMeasurements: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      completionPercentage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        allowNull: false,
      },
      validationPercentage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        allowNull: false,
      },
      generatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Create verifications table
    await queryInterface.createTable('verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      mrvReportId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'mrv_reports', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected', 'requires_changes'),
        defaultValue: 'pending',
        allowNull: false,
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      findings: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      verifiedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'carbon_developers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'carbon_developers', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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
        allowNull: true,
        references: { model: 'mrv_cycles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM(
          'mrv_cycle_created',
          'mrv_cycle_updated',
          'mrv_cycle_submitted',
          'measurement_created',
          'measurement_updated',
          'measurement_submitted',
          'measurement_validated',
          'measurement_rejected',
          'report_generated',
          'report_submitted',
          'verification_recorded',
          'verification_completed'
        ),
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex('measurement_types', ['name']);
    await queryInterface.addIndex('measurement_types', ['category']);

    await queryInterface.addIndex('mrv_cycles', ['projectId']);
    await queryInterface.addIndex('mrv_cycles', ['status']);
    await queryInterface.addIndex('mrv_cycles', ['cycleCode']);

    await queryInterface.addIndex('measurements', ['mrvCycleId']);
    await queryInterface.addIndex('measurements', ['projectId']);
    await queryInterface.addIndex('measurements', ['participantId']);
    await queryInterface.addIndex('measurements', ['measurementTypeId']);
    await queryInterface.addIndex('measurements', ['status']);
    await queryInterface.addIndex('measurements', ['dataCategory']);

    await queryInterface.addIndex('mrv_reports', ['projectId']);
    await queryInterface.addIndex('mrv_reports', ['mrvCycleId']);
    await queryInterface.addIndex('mrv_reports', ['status']);

    await queryInterface.addIndex('verifications', ['mrvReportId']);
    await queryInterface.addIndex('verifications', ['status']);

    await queryInterface.addIndex('audit_logs', ['projectId']);
    await queryInterface.addIndex('audit_logs', ['mrvCycleId']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs', { cascade: true });
    await queryInterface.dropTable('verifications', { cascade: true });
    await queryInterface.dropTable('mrv_reports', { cascade: true });
    await queryInterface.dropTable('measurements', { cascade: true });
    await queryInterface.dropTable('mrv_cycles', { cascade: true });
    await queryInterface.dropTable('measurement_types', { cascade: true });
  },
};
