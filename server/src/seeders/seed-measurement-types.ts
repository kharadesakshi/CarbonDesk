/**
 * Seed script to populate measurement types
 * Run: npx ts-node src/seeders/seed-measurement-types.ts
 */

import { v4 as uuidv4 } from 'uuid';
import MeasurementType from '../models/MeasurementType';
import sequelize from '../config/database';

const measurementTypesData = [
  {
    name: 'Carbon Dioxide Equivalent (CO2e)',
    unit: 'tonnes',
    category: 'GHG_EMISSIONS',
    description: 'Total greenhouse gas emissions expressed as CO2 equivalent',
  },
  {
    name: 'Methane (CH4)',
    unit: 'kg',
    category: 'GHG_EMISSIONS',
    description: 'Methane emissions from various sources',
  },
  {
    name: 'Nitrous Oxide (N2O)',
    unit: 'kg',
    category: 'GHG_EMISSIONS',
    description: 'Nitrous oxide emissions',
  },
  {
    name: 'Forest Area',
    unit: 'hectares',
    category: 'FOREST_DATA',
    description: 'Total area of forest in hectares',
  },
  {
    name: 'Tree Count',
    unit: 'count',
    category: 'FOREST_DATA',
    description: 'Number of trees planted or existing',
  },
  {
    name: 'Biomass',
    unit: 'tonnes',
    category: 'FOREST_DATA',
    description: 'Total biomass in forest area',
  },
  {
    name: 'Soil Carbon',
    unit: 'tonnes/hectare',
    category: 'SOIL_DATA',
    description: 'Carbon stored in soil',
  },
  {
    name: 'Fuel Consumption',
    unit: 'litres',
    category: 'ENERGY_DATA',
    description: 'Fuel consumed for project operations',
  },
  {
    name: 'Electricity Usage',
    unit: 'kWh',
    category: 'ENERGY_DATA',
    description: 'Electricity consumed in project',
  },
  {
    name: 'Renewable Energy Production',
    unit: 'kWh',
    category: 'ENERGY_DATA',
    description: 'Renewable energy produced by project',
  },
  {
    name: 'Water Usage',
    unit: 'litres',
    category: 'WATER_DATA',
    description: 'Water consumption in project',
  },
  {
    name: 'Biodiversity Index',
    unit: 'index',
    category: 'BIODIVERSITY',
    description: 'Measure of biodiversity in project area',
  },
];

async function seedMeasurementTypes() {
  try {
    console.log('🌱 Starting measurement types seed...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if types already exist
    const count = await MeasurementType.count();
    if (count > 0) {
      console.log(`⚠️  ${count} measurement types already exist. Skipping seed.`);
      return;
    }

    // Create all measurement types
    const types = await MeasurementType.bulkCreate(
      measurementTypesData.map((data) => ({
        id: uuidv4(),
        ...data,
      }))
    );

    console.log(`✅ Created ${types.length} measurement types:`);
    types.forEach((type) => {
      console.log(`   - ${type.name} (${type.unit})`);
    });

    console.log('🌱 Seed complete!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seed
seedMeasurementTypes();
