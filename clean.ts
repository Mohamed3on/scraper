import { readFileSync, writeFileSync } from 'fs';

interface Company {
  id: number;
  name: string;
  batch: string;
  website: string;
  location: string;
  one_liner: string;
  long_description: string;
  team_size: number;
  industry: string;
  subindustry: string;
  status: string;
  isHiring: boolean;
  stage: string;
  tags: string[];
  regions: string[];
  industries: string[];
}

// Read the JSON file
const jsonContent = readFileSync('./yc-companies-raw.json', 'utf-8');
const records = JSON.parse(jsonContent);

// Clean the records
const cleanedRecords: Company[] = records.map((record: Record<string, string>) => {
  // Remove ";Remote" from locations and rename the field
  const location = record.all_locations?.replace(/; Remote.*$/, '').trim() || '';

  return {
    id: parseInt(record.id) || 0,
    name: record.name?.trim() || '',
    batch: record.batch?.trim() || '',
    website: record.website?.trim() || '',
    location,
    one_liner: record.one_liner?.trim() || '',
    long_description: record.long_description?.trim() || '',
    team_size: parseInt(record.team_size) || 0,
    industry: record.industry?.trim() || '',
    subindustry: record.subindustry?.trim() || '',
    status: record.status?.trim() || '',
    isHiring: Boolean(record.isHiring),
    stage: record.stage?.trim() || '',
    tags: record.tags || [],
    regions: record.regions || [],
    industries: record.industries || [],
  };
});

// Save as JSON with proper formatting
writeFileSync('./yc-companies-cleaned.json', JSON.stringify(cleanedRecords, null, 2));

// Save as CSV with better escaping
const csvHeaders = Object.keys(cleanedRecords[0]).join(',');
const csvRows = cleanedRecords.map((record) => {
  const escapeCsvValue = (value: string | number | boolean | string[]): string => {
    if (Array.isArray(value)) {
      return `"${value.join(';')}"`;
    }
    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return String(value);
  };

  return [
    record.id,
    escapeCsvValue(record.name),
    escapeCsvValue(record.batch),
    escapeCsvValue(record.website),
    escapeCsvValue(record.location),
    escapeCsvValue(record.one_liner),
    escapeCsvValue(record.long_description),
    record.team_size,
    escapeCsvValue(record.industry),
    escapeCsvValue(record.subindustry),
    escapeCsvValue(record.status),
    record.isHiring,
    escapeCsvValue(record.stage),
    escapeCsvValue(record.tags),
    escapeCsvValue(record.regions),
    escapeCsvValue(record.industries),
  ].join(',');
});

// Write to a new file instead of overwriting the input
const content = [csvHeaders, ...csvRows].join('\n');
writeFileSync('./yc-companies-cleaned.csv', content);

console.log('Data cleaning completed - saved as both JSON and CSV');
