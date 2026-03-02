const fs = require('fs');
const path = require('path');
const readline = require('readline');

const uiReasoningPath = path.join(__dirname, '../.temp-ui-skill/src/ui-ux-pro-max/data/ui-reasoning.csv');
const stylesPath = path.join(__dirname, '../.temp-ui-skill/src/ui-ux-pro-max/data/styles.csv');
const colorsPath = path.join(__dirname, '../.temp-ui-skill/src/ui-ux-pro-max/data/colors.csv');
const outputPath = path.join(__dirname, '../lib/ui-ux-pro-max/index.ts');

// Basic CSV parser (handles quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function parseCSV(filepath) {
    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const lines = [];
    let isFirst = true;
    let headers = [];

    for await (const line of rl) {
        if (!line.trim()) continue;
        const parsed = parseCSVLine(line);
        if (isFirst) {
            headers = parsed;
            isFirst = false;
        } else {
            const row = {};
            headers.forEach((h, i) => {
                row[h.trim()] = parsed[i] ? parsed[i].trim() : '';
            });
            lines.push(row);
        }
    }
    return lines;
}

async function main() {
    const uiReasoningRaw = await parseCSV(uiReasoningPath);
    const stylesRaw = await parseCSV(stylesPath);
    const colorsRaw = await parseCSV(colorsPath);

    // Map to clean objects
    const uiReasoning = uiReasoningRaw.map(row => ({
        category: row['UI_Category'],
        pattern: row['Recommended_Pattern'],
        stylePriority: row['Style_Priority'],
        colorMood: row['Color_Mood'],
        typographyMood: row['Typography_Mood'],
        keyEffects: row['Key_Effects'],
        antiPatterns: row['Anti_Patterns']
    }));

    const styles = stylesRaw.map(row => ({
        name: row['Style Category'],
        keywords: row['Keywords'],
        primaryColors: row['Primary Colors'],
        secondaryColors: row['Secondary Colors'],
        effects: row['Effects & Animation'],
        cssKeywords: row['CSS/Technical Keywords'],
        designVariables: row['Design System Variables']
    }));

    const colors = colorsRaw.map(row => ({
        productType: row['Product Type'],
        primary: row['Primary (Hex)'],
        secondary: row['Secondary (Hex)'],
        cta: row['CTA (Hex)'],
        background: row['Background (Hex)'],
        text: row['Text (Hex)'],
        border: row['Border (Hex)']
    }));

    const fileContent = `// Auto-generated from ui-ux-pro-max-skill datasets
  
export interface UIReasoning {
  category: string;
  pattern: string;
  stylePriority: string;
  colorMood: string;
  typographyMood: string;
  keyEffects: string;
  antiPatterns: string;
}

export interface UIStyle {
  name: string;
  keywords: string;
  primaryColors: string;
  secondaryColors: string;
  effects: string;
  cssKeywords: string;
  designVariables: string;
}

export interface UIColorPalette {
  productType: string;
  primary: string;
  secondary: string;
  cta: string;
  background: string;
  text: string;
  border: string;
}

export const uiReasoningData: UIReasoning[] = ${JSON.stringify(uiReasoning, null, 2)};

export const uiStylesData: UIStyle[] = ${JSON.stringify(styles, null, 2)};

export const uiColorsData: UIColorPalette[] = ${JSON.stringify(colors, null, 2)};

export function getDesignSystem(query: string) {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  
  // 1. Find best matching reasoning
  let bestReasoning = uiReasoningData.find(r => lowerQuery.includes(r.category.toLowerCase()));
  if (!bestReasoning) {
    // fuzzy fallback
    bestReasoning = uiReasoningData.find(r => {
      const words = r.category.toLowerCase().split(/[\\s\\/]+/);
      return words.some(w => w.length > 3 && lowerQuery.includes(w));
    });
  }
  
  // 2. Find best matching style based on reasoning if found
  let matchStyles: UIStyle[] = [];
  if (bestReasoning) {
    const priorities = bestReasoning.stylePriority.split('+').map(s => s.trim().toLowerCase());
    for (const p of priorities) {
      const match = uiStylesData.find(s => s.name.toLowerCase().includes(p) || p.includes(s.name.toLowerCase()));
      if (match) matchStyles.push(match);
    }
  }

  // 3. Find color palette
  let bestColor = uiColorsData.find(c => lowerQuery.includes(c.productType.toLowerCase()));
  if (!bestColor && bestReasoning) {
    bestColor = uiColorsData.find(c => c.productType.toLowerCase().includes(bestReasoning.category.toLowerCase()));
  }

  return {
    reasoning: bestReasoning || null,
    styles: matchStyles.length > 0 ? matchStyles : null,
    colors: bestColor || null
  };
}
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log('Successfully generated lib/ui-ux-pro-max/index.ts');
}

main().catch(console.error);
