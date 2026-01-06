import { getColorForPlot } from "../../utils/colorUtils";
import { addPlotSourceAndLayer } from "../layers/addPlotSourceAndLayer";
import { addPlotEventHandlers } from "../events/addPlotEventHandlers";
import type { NewTrialType } from "../../types";
import { Polygon } from "geojson";

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
  replicantLineDashArray: number[] = [2, 2]
) => {
  trialPlots.forEach((plot, plotIndex: number) => {
    (plot.plot.geojson.geometry as Polygon).coordinates.forEach(
      (polygonCoordinates: any, index: number) => {
        const plotSourceId = `plot-${plotIndex}-${index}`;
        if (!map.current!.getSource(plotSourceId)) {
          const colorNew = getColorForPlot(
            plot,
            index,
            selectedProperty,
            selectedApplication,
            trialPlots
          );
          addPlotSourceAndLayer(
            map,
            plotSourceId,
            polygonCoordinates,
            colorNew,
            fillOpacity,
            lineColor,
            lineWidth
          );
          addPlotEventHandlers(map, plotSourceId, tooltipRef, setHoveredPlot);
        }
      }
    );

    plot.replicants?.forEach((replicant: any) => {
      replicant.geojson.geometry.coordinates.forEach(
        (polygonCoordinates: any, index: number) => {
          const plotSourceId = `replicant-plot-${plotIndex}-${index}`;
          if (!map.current!.getSource(plotSourceId)) {
            const colorNew = getColorForPlot(
              plot,
              index,
              selectedProperty,
              selectedApplication,
              trialPlots
            );
            addPlotSourceAndLayer(
              map,
              plotSourceId,
              polygonCoordinates,
              colorNew,
              fillOpacity,
              lineColor,
              lineWidth,
              true,
              replicantLineDashArray
            );
            addPlotEventHandlers(map, plotSourceId, tooltipRef, setHoveredPlot);
          }
        }
      );
    });
  });
};
