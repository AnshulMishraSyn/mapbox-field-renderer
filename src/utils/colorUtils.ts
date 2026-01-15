export const blueColorShade = {
  20: "#c6e6ff",
  30: "#82cfff",
  40: "#31b4f2",
  50: "#0092e4",
  60: "#0071cd",
  70: "#005693",
  80: "#003b69",
  90: "#002747",
};

export const greenColorShade = {
  20: "#c3ead1",
  30: "#90d6aa",
  40: "#5ebe7f",
  50: "#19a04b",
  60: "#14803c",
  70: "#0c612c",
  80: "#06431c",
  90: "#032d10",
};

export const purpleColorShade = {
  20: "#e7ddfc",
  30: "#d2bdf9",
  40: "#ba99f6",
  50: "#9664f0",
  60: "#8354d6",
  70: "#643aa9",
  80: "#462779",
  90: "#2e1954",
};

export const tealColorShade = {
  20: "#a9efe8",
  30: "#5fd2c8",
  40: "#46bbb0",
  50: "#2b9c92",
  60: "#217c74",
  70: "#165c56",
  80: "#0d413c",
  90: "#062b27",
};

export const orangeColorShade = {
  20: "#ffdac6",
  30: "#ffb59d",
  40: "#ff785a",
  50: "#ee5b3a",
  60: "#c1462b",
  70: "#92331e",
  80: "#682213",
  90: "#48150a",
};

export const pinkColorShade = {
  20: "#ffd8df",
  30: "#ffb2c1",
  40: "#ff7d96",
  50: "#e85d78",
  60: "#bb485d",
  70: "#8d3545",
  80: "#65232f",
  90: "#45161e",
};

export const yellowColorShade = {
  20: "#ffe411",
  30: "#f0c355",
  40: "#e99921",
  50: "#c17e19",
  60: "#9a6412",
  70: "#744a0b",
  80: "#523305",
  90: "#372102",
};

export const cyanColorShade = {
  20: "#ccf7ff",
  30: "#adf2ff",
  40: "#75eaff",
  50: "#3ce1ff",
  60: "#04d9ff",
  70: "#00adcc",
  80: "#00820f",
  90: "#005766",
};

export const magentaColorShade = {
  20: "#FFE5FF",
  30: "#FFACFF",
  40: "#FF73FF",
  50: "#FF39FF",
  60: "#F0F",
  70: "#C0C",
  80: "#909",
  90: "#606",
};

export const limeColorShade = {
  20: "#F7FFD1",
  30: "#F0FFAE",
  40: "#E6FF75",
  50: "#DCFF3D",
  60: "#CEFA05",
  70: "#A3C700",
  80: "#799400",
  90: "#506100",
};

export const colorMatrix = [
  blueColorShade,
  greenColorShade,
  purpleColorShade,
  tealColorShade,
  orangeColorShade,
  pinkColorShade,
  yellowColorShade,
  cyanColorShade,
  magentaColorShade,
  limeColorShade,
];

function getShadeByRate(
  baseH: number,
  baseS: number,
  rates: number[],
  rate: number
): string {
  const sortedRates = [...rates].sort((a, b) => a - b);
  const minRate = sortedRates[0],
    maxRate = sortedRates[sortedRates.length - 1];
  // Example: min maps to 90 (lightest), max maps to 20 (darkest).
  const minL = 90;
  const maxL = 20;
  let l = minL;
  if (maxRate !== minRate) {
    l = minL - ((rate - minRate) / (maxRate - minRate)) * (minL - maxL);
  }
  return hslColor(baseH, baseS, Math.round(l));
}

export const getColorForSeeds = (
  rates: number[],
  rate: number,
  varietyIndex: number,
  trialPlots?: any[],
  variety?: string
) => {
  if (trialPlots && variety) {
    // Gather all dosages for this variety and build a map: color (hex) → array of {rate, color}
    const colorRatesMap: { [color: string]: number[] } = {};
    for (const trialPlot of trialPlots) {
      const dosages = trialPlot?.properties?.seeds?.rates_and_dosages ?? [];
      for (const dosage of dosages) {
        if (
          dosage.variety === variety &&
          dosage.color &&
          typeof dosage.color === "string" &&
          dosage.color.trim().length > 0
        ) {
          const color = dosage.color.trim().toLowerCase();
          if (!colorRatesMap[color]) colorRatesMap[color] = [];
          colorRatesMap[color].push(Number(dosage.rate));
        }
      }
    }

    // Now, find the color (if any) for THIS rate, and check if the color applies to multiple rates
    for (const trialPlot of trialPlots) {
      const dosages = trialPlot?.properties?.seeds?.rates_and_dosages ?? [];
      for (const dosage of dosages) {
        if (
          dosage.variety === variety &&
          Number(dosage.rate) === Number(rate) &&
          dosage.color &&
          typeof dosage.color === "string" &&
          dosage.color.trim().length > 0
        ) {
          const color = dosage.color.trim().toLowerCase();
          const ratesForColor = colorRatesMap[color];
          if (ratesForColor && ratesForColor.length > 1) {
            // CASE 1: Multiple rates share this color for this variety! Apply HSL lightness transformation.
            const { h, s } = hexToHSL(color);
            return getShadeByRate(h, s, ratesForColor, rate);
          }
          // CASE 2: Only one rate for this color, just use normal color
          return color;
        }
      }
    }
  }

  // Old/Default logic:
  const colorShade = colorMatrix[varietyIndex % colorMatrix.length] ?? [];
  const average = rates.reduce((sum, r) => sum + r, 0) / rates.length;

  if (rate === average) return colorShade[50];

  if (rate < average) {
    const lowerThanAvg = rates.filter((r) => r < average).sort((a, b) => b - a);
    const position = lowerThanAvg.indexOf(rate);
    if (position === 0) return colorShade[40];
    if (position === 1) return colorShade[30];
    return colorShade[20];
  }

  if (rate > average) {
    const higherThanAvg = rates
      .filter((r) => r > average)
      .sort((a, b) => a - b);
    const position = higherThanAvg.indexOf(rate);
    if (position === 0) return colorShade[60];
    if (position === 1) return colorShade[70];
    if (position === 2) return colorShade[80];
    return colorShade[90];
  }

  return colorShade[50];
};

// export const getColorForSeeds = (
//   rates: number[],
//   rate: number,
//   varietyIndex: number,
//   trialPlots?: any[],
//   variety?: string
// ) => {
//   // First, new logic: try to find and return color if exact match in trialPlots
//   if (trialPlots && variety) {
//     for (const trialPlot of trialPlots) {
//       const dosages = trialPlot?.properties?.seeds?.rates_and_dosages ?? [];
//       for (const dosage of dosages) {
//         if (
//           dosage.variety === variety &&
//           Number(dosage.rate) === Number(rate) &&
//           dosage.color &&
//           typeof dosage.color === "string" &&
//           dosage.color.trim().length > 0
//         ) {
//           return dosage.color;
//         }
//       }
//     }
//   }

//   // Old/Default logic:
//   const colorShade = colorMatrix[varietyIndex % colorMatrix.length] ?? [];
//   const average = rates.reduce((sum, r) => sum + r, 0) / rates.length;

//   if (rate === average) return colorShade[50];

//   if (rate < average) {
//     const lowerThanAvg = rates.filter((r) => r < average).sort((a, b) => b - a);
//     const position = lowerThanAvg.indexOf(rate);
//     if (position === 0) return colorShade[40];
//     if (position === 1) return colorShade[30];
//     return colorShade[20];
//   }

//   if (rate > average) {
//     const higherThanAvg = rates
//       .filter((r) => r > average)
//       .sort((a, b) => a - b);
//     const position = higherThanAvg.indexOf(rate);
//     if (position === 0) return colorShade[60];
//     if (position === 1) return colorShade[70];
//     if (position === 2) return colorShade[80];
//     return colorShade[90];
//   }

//   return colorShade[50];
// };

export const getColorForBiologicals = (
  treated: boolean,
  index: number,
  trialPlots?: any,
  selectedApplication?: number // Make it optional
) => {
  // If index is undefined or null, use 0 as the application index
  const applicationIndex =
    selectedApplication !== undefined && selectedApplication !== null
      ? selectedApplication
      : index !== undefined && index !== null
      ? index
      : 0;

  if (treated === false) {
    return "#DFE2E7";
  }

  if (!trialPlots) return undefined;

  for (const trialPlot of trialPlots) {
    const treatments =
      trialPlot?.properties?.biologicals?.treatments?.[applicationIndex] ?? [];
    for (
      let treatmentsIndex = 0;
      treatmentsIndex < treatments.length;
      treatmentsIndex++
    ) {
      if (index === treatmentsIndex) {
        return treatments[treatmentsIndex].color;
      }
    }
  }

  return "";
};

// A helper to return HSL color string
function hslColor(h: number, s: number, l: number) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// A helper to convert hex color to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove "#"
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }

  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return { h, s, l };
}

// Your getColorForFertilisers function
export const getColorForFertilisers = (
  rates: number[],
  rate: number,
  commonColorForFertilisers?: string
) => {
  // Old logic
  const average = rates.reduce((sum, r) => sum + r, 0) / rates.length;

  // New logic if commonColorForFertilisers is given
  if (commonColorForFertilisers) {
    // Find min and max rates
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    // Convert hex to HSL
    const baseHSL = hexToHSL(commonColorForFertilisers);

    // Map rate to lightness: low rate => high lightness, high rate => low lightness
    // You can fine-tune these lightness bounds as needed
    const minLightness = 25; // darkest allowed
    const maxLightness = 85; // lightest allowed

    // Normalize the rate to [0, 1]
    let normalized = 0;
    if (maxRate !== minRate) {
      normalized = (rate - minRate) / (maxRate - minRate);
    }

    // Interpolate lightness
    // Higher normalized => darker shade
    const lightness = Math.round(
      maxLightness - normalized * (maxLightness - minLightness)
    );

    // Return the modified HSL color string
    return hslColor(baseHSL.h, baseHSL.s, lightness);
  }

  // If no commonColorForFertilisers, old logic
  if (rate === average) return blueColorShade[50];

  if (rate < average) {
    const lowerThanAvg = rates.filter((r) => r < average).sort((a, b) => b - a);
    const position = lowerThanAvg.indexOf(rate);
    if (position === 0) return blueColorShade[40];
    if (position === 1) return blueColorShade[30];
    return blueColorShade[20];
  }

  if (rate > average) {
    const higherThanAvg = rates
      .filter((r) => r > average)
      .sort((a, b) => a - b);
    const position = higherThanAvg.indexOf(rate);
    if (position === 0) return blueColorShade[60];
    if (position === 1) return blueColorShade[70];
    if (position === 2) return blueColorShade[80];
    return blueColorShade[90];
  }

  return blueColorShade[50];
};

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getColorForPlot = (
  plot: any,
  index: number,
  selectedProperty: string,
  selectedApplication: number = 0,
  trialPlots?: any[]
) => {
  let colorNew = getRandomColor();
  if (selectedProperty === "seeds") {
    const rates = plot.properties.seeds.rates_and_dosages.map(
      (d: any) => d.rate
    );
    const varieties: any = {};
    plot.properties.seeds.rates_and_dosages.map(
      (d: any) => (varieties[d.variety] = true)
    );
    const rate = plot.properties.seeds.rates_and_dosages[index].rate;
    const varietyIndex = Object.keys(varieties).indexOf(
      plot.properties.seeds.rates_and_dosages[index].variety
    );
    const variety = plot.properties.seeds.rates_and_dosages[index].variety;

    colorNew = getColorForSeeds(rates, rate, varietyIndex, trialPlots, variety);
  } else if (selectedProperty === "biologicals") {
    const treated =
      plot?.properties?.biologicals?.treatments?.[selectedApplication]?.[index]
        ?.treated ?? false;
    colorNew =
      getColorForBiologicals(treated, index, trialPlots, selectedApplication) ??
      getRandomColor();
  } else if (selectedProperty === "fertilisers") {
    const rates =
      plot?.properties?.fertilisers?.rates_and_dosages?.map(
        (d: any) => d.rate
      ) ?? [];
    const rate =
      plot?.properties?.fertilisers?.rates_and_dosages?.[index]?.rate ?? 0;
    const ratesAndDosages =
      trialPlots?.[0]?.properties?.fertilisers?.rates_and_dosages;
    // If the array exists and is not empty, extract the color from the first entry
    let commonColorForFertilisers: string | undefined = undefined;
    if (Array.isArray(ratesAndDosages) && ratesAndDosages.length > 0) {
      commonColorForFertilisers = ratesAndDosages[0].color;
    }

    colorNew = getColorForFertilisers(rates, rate, commonColorForFertilisers);
  }

  return colorNew;
};
