import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, Download } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { AppShell, PageHeader } from '../components/ui';
import { getProjectGIS, saveProjectGIS, deleteProjectGIS } from '../services/gis.service';
import { getProject } from '../services/project.service';
import { Project, ProjectGIS } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export function GISPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const isMapInitialized = useRef(false);

  const [project, setProject] = useState<Project | null>(null);
  const [gis, setGis] = useState<ProjectGIS | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areaHa, setAreaHa] = useState<number | null>(null);
  const [perimeterKm, setPerimeterKm] = useState<number | null>(null);
  const [coordCount, setCoordCount] = useState(0);

  // Load project and GIS data
  useEffect(() => {
    async function load() {
      if (!projectId) return;
      try {
        const [proj, gisData] = await Promise.all([
          getProject(projectId),
          getProjectGIS(projectId),
        ]);
        setProject(proj);
        setGis(gisData || null);
        console.log('Loaded GIS data:', gisData);
      } catch (err) {
        console.error('Failed to load project/GIS data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Initialize map
  useEffect(() => {
    if (isMapInitialized.current || !mapContainer.current || !projectId) return;

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    const container = mapContainer.current;
    if (!container) return;

    // Get initial center
    let centerLng = 78.9629;
    let centerLat = 20.5937;
    let zoom = 5;

    if (gis) {
      if (gis.centerLongitude && gis.centerLatitude) {
        centerLng = gis.centerLongitude;
        centerLat = gis.centerLatitude;
        zoom = gis.mapZoom || 12;
      }
    } else if (project && project.longitude && project.latitude) {
      centerLng = project.longitude;
      centerLat = project.latitude;
      zoom = 12;
    }

    console.log('Initializing map with center:', centerLng, centerLat, 'zoom:', zoom);

    map.current = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [centerLng, centerLat],
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded');
      
      if (!map.current) return;

      // Add project location marker
      const projectLat = project?.latitude;
      const projectLng = project?.longitude;
      
      if (projectLat && projectLng && projectLat !== 0 && projectLng !== 0) {
        const markerEl = document.createElement('div');
        markerEl.className = 'project-location-marker';
        markerEl.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #10b981;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        `;
        markerEl.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        `;
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: system-ui; padding: 4px;">
            <p style="font-weight: 600; margin: 0;">${project?.name || 'Project Location'}</p>
            <p style="font-size: 12px; margin: 4px 0 0; color: #666;">
              📍 ${projectLat.toFixed(6)}, ${projectLng.toFixed(6)}
            </p>
          </div>
        `);

        marker.current = new mapboxgl.Marker(markerEl)
          .setLngLat([projectLng, projectLat])
          .setPopup(popup)
          .addTo(map.current);
      }

      // Initialize Draw
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          point: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      });

      map.current.addControl(draw.current);

      // Load existing boundary if available
      if (gis?.boundaryGeoJSON) {
        console.log('Loading boundary from GIS data');
        loadBoundary();
      }

      // Update metrics on draw changes
      const updateOnChange = () => {
        setTimeout(() => updateAreaMetrics(), 100);
      };
      
      map.current.on('draw.create', updateOnChange);
      map.current.on('draw.update', updateOnChange);
      map.current.on('draw.delete', updateOnChange);
    });

    isMapInitialized.current = true;

    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isMapInitialized.current = false;
    };
  }, [projectId, project, gis]);

  // Load boundary function
  const loadBoundary = () => {
    if (!gis?.boundaryGeoJSON || !map.current || !draw.current) {
      console.log('Missing data for loading boundary');
      return;
    }

    try {
      console.log('Parsing boundary GeoJSON:', gis.boundaryGeoJSON);
      const geojson = JSON.parse(gis.boundaryGeoJSON);
      console.log('Parsed GeoJSON:', geojson);
      
      // Check if it's a valid Feature
      if (geojson.type === 'Feature' && geojson.geometry) {
        // Create a clean feature for Mapbox Draw
        const cleanFeature = {
          type: 'Feature',
          id: 'boundary',
          geometry: geojson.geometry,
          properties: geojson.properties || {}
        };
        
        console.log('Clean feature for draw:', cleanFeature);
        
        // Delete all existing features first
        draw.current.deleteAll();
        
        // Add the feature
        draw.current.add(cleanFeature);
        console.log('Boundary added to draw control');
        
        // Get the feature to verify it was added
        const allFeatures = draw.current.getAll();
        console.log('All features after adding:', allFeatures);
        
        // Extract coordinates for fitting bounds
        let coordinates: any[] = [];
        const geom = cleanFeature.geometry;
        
        if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates.length > 0) {
          coordinates = geom.coordinates[0];
        } else if (geom.type === 'MultiPolygon' && geom.coordinates && geom.coordinates.length > 0) {
          coordinates = geom.coordinates[0][0];
        }
        
        // Fit map to the boundary
        if (coordinates.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          map.current.fitBounds(bounds, { padding: 40 });
          console.log('Map fitted to boundary');
        }

        // Update metrics
        setTimeout(() => updateAreaMetrics(), 300);
      } else {
        console.warn('Invalid GeoJSON format:', geojson);
      }
    } catch (err) {
      console.error('Failed to parse or load GeoJSON:', err);
    }
  };

  // Calculate and display area/perimeter metrics
  function updateAreaMetrics() {
    if (!draw.current) {
      console.log('Draw not available for metrics');
      return;
    }

    const data = draw.current.getAll();
    console.log('Draw data for metrics:', data);
    
    if (!data.features || data.features.length === 0) {
      setAreaHa(null);
      setPerimeterKm(null);
      setCoordCount(0);
      return;
    }

    try {
      const polygonFeature = data.features.find(
        (f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      );

      if (!polygonFeature) {
        setAreaHa(null);
        setPerimeterKm(null);
        setCoordCount(0);
        return;
      }

      const area = turf.area(polygonFeature);
      const areaHectares = area / 10000;
      setAreaHa(areaHectares);

      if (polygonFeature.geometry.type === 'Polygon') {
        const perimeter = turf.length(polygonFeature, { units: 'kilometers' });
        setPerimeterKm(perimeter);

        const geom = polygonFeature.geometry;
        if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates.length > 0) {
          const coords = geom.coordinates[0];
          setCoordCount(coords ? coords.length - 1 : 0);
        } else {
          setCoordCount(0);
        }
      } else if (polygonFeature.geometry.type === 'MultiPolygon') {
        let totalPerimeter = 0;
        let totalCoords = 0;
        const geom = polygonFeature.geometry;
        if (geom.type === 'MultiPolygon' && geom.coordinates) {
          geom.coordinates.forEach((polygon: any) => {
            const polyFeature = turf.polygon(polygon);
            totalPerimeter += turf.length(polyFeature, { units: 'kilometers' });
            if (polygon && polygon[0]) {
              totalCoords += polygon[0].length - 1;
            }
          });
        }
        setPerimeterKm(totalPerimeter);
        setCoordCount(totalCoords);
      } else {
        setPerimeterKm(null);
        setCoordCount(0);
      }
    } catch (err) {
      console.error('Error calculating metrics:', err);
    }
  }

  const handleSave = async () => {
    if (!projectId || !draw.current) return;

    const data = draw.current.getAll();
    if (!data.features || data.features.length === 0) {
      alert('Please draw a project boundary polygon');
      return;
    }

    const polygonFeature = data.features.find(
      (f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
    );

    if (!polygonFeature) {
      alert('Please draw a polygon (not a line or point)');
      return;
    }

    setSaving(true);
    try {
      const area = turf.area(polygonFeature);
      const areaHectares = area / 10000;
      let perimeter = 0;
      if (polygonFeature.geometry.type === 'Polygon') {
        perimeter = turf.length(polygonFeature, { units: 'kilometers' });
      } else {
        const geom = polygonFeature.geometry;
        if (geom.type === 'MultiPolygon' && geom.coordinates) {
          geom.coordinates.forEach((polygon: any) => {
            perimeter += turf.length(turf.polygon(polygon), { units: 'kilometers' });
          });
        }
      }

      const center = map.current!.getCenter();

      // Remove the id before saving to avoid issues
      const featureToSave = {
        type: 'Feature',
        geometry: polygonFeature.geometry,
        properties: polygonFeature.properties || {}
      };

      await saveProjectGIS(projectId, {
        centerLatitude: center.lat,
        centerLongitude: center.lng,
        boundaryGeoJSON: JSON.stringify(featureToSave),
        calculatedAreaHa: areaHectares,
        perimeterKm: perimeter,
        mapZoom: map.current!.getZoom(),
        coordinateSystem: 'WGS84',
      });

      const updatedGis = await getProjectGIS(projectId);
      setGis(updatedGis);
      
      // Reload the boundary after save
      setTimeout(() => {
        if (updatedGis?.boundaryGeoJSON) {
          loadBoundary();
        }
      }, 300);

      alert('✓ GIS boundary saved successfully');
    } catch (err) {
      console.error('Failed to save GIS data:', err);
      alert('Failed to save GIS boundary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Clear all drawn features?')) {
      draw.current?.deleteAll();
      setTimeout(() => updateAreaMetrics(), 100);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !gis) return;

    if (confirm('Delete this project boundary? This cannot be undone.')) {
      try {
        await deleteProjectGIS(projectId);
        setGis(null);
        draw.current?.deleteAll();
        setTimeout(() => updateAreaMetrics(), 100);
        alert('✓ GIS boundary deleted');
      } catch (err) {
        console.error('Failed to delete GIS:', err);
        alert('Failed to delete GIS boundary');
      }
    }
  };

  const handleExportGeoJSON = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (!data.features || data.features.length === 0) {
      alert('No features to export');
      return;
    }

    const geojson = JSON.stringify(data, null, 2);
    const blob = new Blob([geojson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId}-boundary.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-forest" />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="rounded border border-dashed border-stone-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-bold text-forest-deep">Project Not Found</h2>
          <button onClick={() => navigate('/projects')} className="mt-4 text-forest hover:underline">
            Back to Projects
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="GIS Mapping"
        description={`Draw and manage project boundary for ${project.name}`}
      />

      <div className="rounded border border-line bg-white overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_340px] min-h-[600px]">
          <div
            ref={mapContainer}
            className="relative bg-stone-200"
            style={{ height: '600px', width: '100%' }}
          >
            {!mapboxgl.accessToken && (
              <div className="flex items-center justify-center h-full bg-yellow-50">
                <div className="text-center p-6">
                  <p className="font-bold text-amber-900">Mapbox token not configured</p>
                  <p className="text-sm text-amber-700">Add VITE_MAPBOX_ACCESS_TOKEN to .env</p>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-stone-50 border-l border-line p-5 flex flex-col">
            <div className="rounded bg-emerald-50 p-3 text-sm font-bold text-success mb-4">
              🗺️ Mapping Mode Active
            </div>

            {project && project.latitude && project.longitude && project.latitude !== 0 && project.longitude !== 0 && (
              <div className="rounded bg-blue-50 p-3 text-xs text-blue-900 mb-4">
                <p className="font-bold">📍 Project Location</p>
                <p className="mt-1">
                  {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                </p>
              </div>
            )}

            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold uppercase text-stone-500 mb-1">Area</h3>
                <p className="text-2xl font-bold text-forest">
                  {areaHa !== null ? areaHa.toFixed(2) : '—'} <span className="text-sm">ha</span>
                </p>
              </div>

              {perimeterKm !== null && perimeterKm > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-stone-500 mb-1">Perimeter</h3>
                  <p className="text-lg font-bold">
                    {perimeterKm.toFixed(2)} <span className="text-sm">km</span>
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase text-stone-500 mb-1">Coordinates</h3>
                <p className="text-lg font-bold text-stone-700">{coordCount}</p>
                <p className="text-xs text-stone-500">vertices collected</p>
              </div>

              {gis && (
                <div className="rounded bg-blue-50 p-3 text-xs text-blue-900">
                  <p className="font-bold">Boundary Saved</p>
                  <p className="mt-1">Last edit: {new Date(gis.updatedAt).toLocaleDateString()}</p>
                  <p className="mt-1 text-xs text-blue-700">Area: {gis.calculatedAreaHa?.toFixed(2)} ha</p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-stone-200 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || coordCount === 0}
                className="w-full rounded bg-success px-3 py-2.5 font-bold text-white hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Boundary'}
              </button>

              <button
                onClick={handleClear}
                className="w-full rounded border border-stone-300 px-3 py-2 font-bold text-stone-600 hover:bg-white flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Clear
              </button>

              {gis && (
                <>
                  <button
                    onClick={handleExportGeoJSON}
                    className="w-full rounded border border-stone-300 px-3 py-2 font-bold text-stone-600 hover:bg-white flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Export GeoJSON
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full rounded border border-red-300 px-3 py-2 font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete Boundary
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-6 rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-bold mb-2">📍 How to use:</p>
        <ul className="space-y-1 text-xs">
          <li>• Click the <strong>Polygon</strong> button to start drawing</li>
          <li>• Click on the map to add vertices (corner points)</li>
          <li>• Double-click or press <strong>Enter</strong> to finish the polygon</li>
          <li>• Click the <strong>Trash</strong> button to delete the selected feature</li>
          <li>• Edit by selecting and dragging vertices</li>
          <li>• Click <strong>Save Boundary</strong> to store in database</li>
          <li>• Area and perimeter calculate automatically</li>
          <li>• The green marker shows the project location</li>
        </ul>
      </div>
    </AppShell>
  );
}