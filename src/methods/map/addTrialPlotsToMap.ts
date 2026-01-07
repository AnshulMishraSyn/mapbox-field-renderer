import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import { MultiPolygon } from "geojson";
import { getColorForPlot } from "../../utils/colorUtils";
import type { NewTrialType } from "../../types";

export const addLabelToMap = (
  map: mapboxgl.Map,
  sourceId: string,
  label: string,
  position: "top" | "bottom" | "left" | "right" | "center",
  offset: [number, number],
  type: string,
  size: number
) => {
  const labelLayerId = `${sourceId}-label-${type}`;

  // Set default values for different label types
  const defaultOffsets: Record<string, [number, number]> = {
    group: [0, -0.2], // Group labels (A, B, C, etc.) slightly above the plot
    plot: [0, 0], // Plot labels (1, 2, 3, etc.) centered
  };

  const defaultSizes: Record<string, number> = {
    group: 14, // Larger for group labels
    plot: 12, // Normal size for plot labels
  };

  // Use the provided values or defaults
  const finalOffset = offset || defaultOffsets[type] || [0, 0];
  const finalSize = size || defaultSizes[type] || 12;

  // Remove existing label layer if it exists
  if (map.getLayer(labelLayerId)) {
    map.removeLayer(labelLayerId);
  }

  // Add the label layer at the top of all layers
  const style = map.getStyle();
  const layers = style?.layers || [];
  const topLayerId =
    layers.length > 0 ? layers[layers.length - 1].id : undefined;

  map.addLayer(
    {
      id: labelLayerId,
      type: "symbol",
      source: sourceId,
      layout: {
        "text-field": String(label), // Ensure label is treated as a string
        "text-size": finalSize,
        "text-offset": finalOffset,
        "text-anchor": position,
        // "text-allow-overlap": true, // Allow labels to overlap with other map elements
        //  "text-ignore-placement": true, // Prioritize showing these labels
        "symbol-z-order": "source", // Ensure labels appear on top based on source order
      },
      paint: {
        "text-color": type === "group" ? "#FFFFFF" : "#FFFFFF",
        "text-halo-color": type === "group" ? "#000000" : "#000000",
        "text-halo-width": type === "group" ? 2 : 1.5, // Stronger halo for group labels
        "text-opacity": 1,
      },
    },
    topLayerId
  );
};

const addGroupLabelToMap = (
  map: mapboxgl.Map,
  sourceId: string,
  label: string,
  coordinates: MultiPolygon["coordinates"]
) => {
  const groupSourceId = `${sourceId}-group-label`;
  const labelLayerId = `${sourceId}-label-group`;

  // Remove existing group label source and layer
  if (map.getLayer(labelLayerId)) {
    map.removeLayer(labelLayerId);
  }
  if (map.getSource(groupSourceId)) {
    map.removeSource(groupSourceId);
  }

  // Calculate centroid of all polygons
  const allPolygons = coordinates.map((polygonCoords) => ({
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: polygonCoords,
    },
    properties: {},
  }));

  const featureCollection = turf.featureCollection(allPolygons);
  const centroid = turf.centroid(featureCollection);
  const bbox = turf.bbox(featureCollection);

  // Position the label outside the plot group (above the top of the bounding box)
  const labelPosition = [
    centroid.geometry.coordinates[0], // x: center horizontally
    bbox[3], // y: top of bounding box
  ];

  // Create point source for group label
  const groupLabelSource: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: labelPosition,
        },
        properties: {
          label: label,
        },
      },
    ],
  };

  // Add group label source
  map.addSource(groupSourceId, {
    type: "geojson",
    data: groupLabelSource,
  });

  // Add group label layer
  map.addLayer({
    id: labelLayerId,
    type: "symbol",
    source: groupSourceId,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 14,
      "text-offset": [0, -0.2],
      "text-anchor": "bottom",
      "symbol-z-order": "source",
    },
    paint: {
      "text-color": "#FFFFFF",
      "text-halo-color": "#000000",
      "text-halo-width": 2,
      "text-opacity": 1,
    },
  });
};

export const addMultiPolygonSourceWithMarker = (
  map: React.MutableRefObject<mapboxgl.Map | null>,
  sourceId: string,
  coordinates: MultiPolygon["coordinates"],
  plot: any,
  selectedProperty: string,
  selectedApplication: number,
  fillOpacity: number,
  lineColor: string,
  lineWidth: number,
  replicant: boolean = false,
  replicantLineDashArray?: number[],
  trialPlots?: any[]
) => {
  if (!map.current) return;

  // Remove existing layers first
  if (map.current.getLayer(sourceId)) {
    map.current.removeLayer(sourceId);
  }

  // Remove existing label layers
  if (map.current.getLayer(`${sourceId}-label-group`)) {
    map.current.removeLayer(`${sourceId}-label-group`);
  }

  // Remove group label layers (new naming convention)
  if (map.current.getLayer(`${sourceId}-group-label-label-group`)) {
    map.current.removeLayer(`${sourceId}-group-label-label-group`);
  }

  if (map.current.getLayer(`${sourceId}-label-plot`)) {
    map.current.removeLayer(`${sourceId}-label-plot`);
  }

  // Remove legacy label layers for compatibility
  if (map.current.getLayer(`${sourceId}-label`)) {
    map.current.removeLayer(`${sourceId}-label`);
  }

  if (map.current.getLayer(`${sourceId}-label-plotName`)) {
    map.current.removeLayer(`${sourceId}-label-plotName`);
  }

  if (map.current.getLayer(`${sourceId}-outline`)) {
    map.current.removeLayer(`${sourceId}-outline`);
  }

  // Remove existing sources
  if (map.current.getSource(sourceId)) {
    map.current.removeSource(sourceId);
  }

  // Remove group label source
  if (map.current.getSource(`${sourceId}-group-label`)) {
    map.current.removeSource(`${sourceId}-group-label`);
  }

  // Create FeatureCollection where each polygon gets a unique color
  const geoJsonData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: coordinates.map((polygonCoords, index) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: polygonCoords,
      },
      properties: {
        color: getColorForPlot(
          plot,
          index,
          selectedProperty,
          selectedApplication,
          trialPlots
        ),
        description: `${sourceId}-${index}`,
        label: index + 1,
      },
    })),
  };

  // Add GeoJSON Source
  map.current.addSource(sourceId, {
    type: "geojson",
    data: geoJsonData,
  });

  // Add Fill Layer (Using data-driven styling for color)
  map.current.addLayer({
    id: sourceId,
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": fillOpacity,
    },
  });
  const groupLabel = +sourceId.split("-")?.[sourceId.split("-").length - 1];

  // Create separate source for group label positioned outside the plot group
  const groupLabelSourceId = `${sourceId}-group-label`;

  // Calculate bounding box and position label outside the plot group
  const allPolygons = coordinates.map((polygonCoords) => ({
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: polygonCoords,
    },
    properties: {},
  }));

  const featureCollection = turf.featureCollection(allPolygons);
  const centroid = turf.centroid(featureCollection);
  const bbox = turf.bbox(featureCollection);

  // Position the label above the plot group
  const labelPosition = [
    centroid.geometry.coordinates[0], // x: center horizontally
    bbox[3], // y: top of bounding box
  ];

  // Create separate point source for group label
  const groupLabelGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: labelPosition,
        },
        properties: {
          label: replicant
            ? `${String.fromCharCode(65 + groupLabel)}'` // A', B', C' for replicants
            : String.fromCharCode(65 + groupLabel), // A, B, C for main plots
        },
      },
    ],
  };

  // Remove existing group label source if it exists
  if (map.current.getSource(groupLabelSourceId)) {
    map.current.removeSource(groupLabelSourceId);
  }

  // Add group label source
  map.current.addSource(groupLabelSourceId, {
    type: "geojson",
    data: groupLabelGeoJson,
  });

  // Add group label using the improved function
  if (map.current) {
    const groupLabelText = replicant
      ? `${String.fromCharCode(65 + groupLabel)}'` // A', B', C' for replicants
      : String.fromCharCode(65 + groupLabel); // A, B, C for main plots

    addLabelToMap(
      map.current,
      groupLabelSourceId,
      groupLabelText, // Group label (A, B, C or A', B', C')
      "bottom", // Anchor at the bottom of the text so it points to the plot
      [0, -0.2], // Small negative y offset to position closer to the plot
      "group",
      14 // Increased size for better visibility
    );
  }

  // Add plot number labels - these will use the "label" property from the GeoJSON features
  map.current.addLayer({
    id: `${sourceId}-label-plot`,
    type: "symbol",
    source: sourceId,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-offset": [0, 0],
      "text-anchor": "center",
      "symbol-z-order": "source",
    },
    paint: {
      "text-color": "#FFFFFF",
      "text-halo-color": "#000000",
      "text-halo-width": 1.5,
      "text-opacity": 1,
    },
  });

  // Add Outline Layer
  map.current.addLayer({
    id: `${sourceId}-outline`,
    type: "line",
    source: sourceId,
    layout: {},
    paint: {
      "line-color": lineColor,
      "line-width": lineWidth,
      ...(replicant && replicantLineDashArray
        ? { "line-dasharray": replicantLineDashArray }
        : {}),
    },
  });
};

export const addTrialPlotsToMap = (
  map: React.MutableRefObject<mapboxgl.Map | null>,
  trialPlots: NewTrialType["trial_plots"],
  selectedProperty: string,
  selectedApplication: number,
  tooltipRef: any,
  setHoveredPlot: any,
  fillOpacity: number = 0.8,
  lineColor: string = "#ffffff",
  lineWidth: number = 1,
  replicantLineDashArray: number[] = [2, 2],
  prefix: string = ""
) => {
  if (!map.current) return;

  trialPlots.forEach((plot, plotIndex: number) => {
    // Add main plot
    const mainPlotSourceId = `${prefix}plot-${plotIndex}`;
    addMultiPolygonSourceWithMarker(
      map,
      mainPlotSourceId,
      (plot.plot.geojson.geometry as MultiPolygon).coordinates,
      plot,
      selectedProperty,
      selectedApplication,
      fillOpacity,
      lineColor,
      lineWidth,
      false, // not a replicant
      undefined, // no dash array for main plots
      trialPlots
    );

    // Add replicants

    plot.replicants?.forEach((replicant, rindex) => {
      const replicantCoordinates: MultiPolygon["coordinates"] = [];
      replicantCoordinates.push(
        ...(replicant.geojson.geometry as MultiPolygon).coordinates
      );
      if (replicantCoordinates.length > 0) {
        const replicantSourceId = `${prefix}replicant-plot-${rindex}-${plotIndex}`;
        addMultiPolygonSourceWithMarker(
          map,
          replicantSourceId,
          replicantCoordinates,
          plot,
          selectedProperty,
          selectedApplication,
          fillOpacity,
          lineColor,
          lineWidth,
          true,
          replicantLineDashArray,
          trialPlots
        );
      }
    });
  });
};
