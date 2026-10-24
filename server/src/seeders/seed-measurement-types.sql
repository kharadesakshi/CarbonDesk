-- Seed measurement types
-- This script populates the measurement_types table with common measurement types

INSERT INTO measurement_types (id, name, unit, category, description, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Carbon Dioxide Equivalent (CO2e)', 'tonnes', 'GHG_EMISSIONS', 'Total greenhouse gas emissions expressed as CO2 equivalent', NOW(), NOW()),
  (gen_random_uuid(), 'Methane (CH4)', 'kg', 'GHG_EMISSIONS', 'Methane emissions from various sources', NOW(), NOW()),
  (gen_random_uuid(), 'Nitrous Oxide (N2O)', 'kg', 'GHG_EMISSIONS', 'Nitrous oxide emissions', NOW(), NOW()),
  (gen_random_uuid(), 'Forest Area', 'hectares', 'FOREST_DATA', 'Total area of forest in hectares', NOW(), NOW()),
  (gen_random_uuid(), 'Tree Count', 'count', 'FOREST_DATA', 'Number of trees planted or existing', NOW(), NOW()),
  (gen_random_uuid(), 'Biomass', 'tonnes', 'FOREST_DATA', 'Total biomass in forest area', NOW(), NOW()),
  (gen_random_uuid(), 'Soil Carbon', 'tonnes/hectare', 'SOIL_DATA', 'Carbon stored in soil', NOW(), NOW()),
  (gen_random_uuid(), 'Fuel Consumption', 'litres', 'ENERGY_DATA', 'Fuel consumed for project operations', NOW(), NOW()),
  (gen_random_uuid(), 'Electricity Usage', 'kWh', 'ENERGY_DATA', 'Electricity consumed in project', NOW(), NOW()),
  (gen_random_uuid(), 'Renewable Energy Production', 'kWh', 'ENERGY_DATA', 'Renewable energy produced by project', NOW(), NOW()),
  (gen_random_uuid(), 'Water Usage', 'litres', 'WATER_DATA', 'Water consumption in project', NOW(), NOW()),
  (gen_random_uuid(), 'Biodiversity Index', 'index', 'BIODIVERSITY', 'Measure of biodiversity in project area', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
