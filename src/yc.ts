import { writeFileSync } from 'node:fs';
import { stringify } from 'csv-stringify/sync';

// Update interface to match full company data
interface YCCompanyFull {
  id: number;
  name: string;
  slug: string;
  website: string;
  all_locations: string;
  long_description: string;
  one_liner: string;
  team_size: number;
  industry: string;
  subindustry: string;
  launched_at: number;
  tags: string[];
  isHiring: boolean;
  nonprofit: boolean;
  batch: string;
  status: string;
  industries: string[];
  regions: string[];
  stage: string;
  [key: string]: unknown; // For other fields we might not use
}

async function fetchYCBatch(batch: string) {
  const url = 'https://45bwzj1sgc-dsn.algolia.net/1/indexes/*/queries';

  const headers = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded',
    'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'x-algolia-application-id': '45BWZJ1SGC',
    'x-algolia-api-key':
      'MjBjYjRiMzY0NzdhZWY0NjExY2NhZjYxMGIxYjc2MTAwNWFkNTkwNTc4NjgxYjU0YzFhYTY2ZGQ5OGY5NDMxZnJlc3RyaWN0SW5kaWNlcz0lNUIlMjJZQ0NvbXBhbnlfcHJvZHVjdGlvbiUyMiUyQyUyMllDQ29tcGFueV9CeV9MYXVuY2hfRGF0ZV9wcm9kdWN0aW9uJTIyJTVEJnRhZ0ZpbHRlcnM9JTVCJTIyeWNkY19wdWJsaWMlMjIlNUQmYW5hbHl0aWNzVGFncz0lNUIlMjJ5Y2RjJTIyJTVE',
  };

  const requestBody = {
    requests: [
      {
        indexName: 'YCCompany_production',
        params: `facetFilters=%5B%5B%22batch%3A${batch}%22%5D%5D&facets=%5B%22app_answers%22%2C%22app_video_public%22%2C%22batch%22%2C%22demo_day_video_public%22%2C%22industries%22%2C%22isHiring%22%2C%22nonprofit%22%2C%22question_answers%22%2C%22regions%22%2C%22subindustry%22%2C%22top_company%22%5D&hitsPerPage=1000&maxValuesPerFacet=1000&page=0&query=&tagFilters=`,
      },
      {
        indexName: 'YCCompany_production',
        params:
          'analytics=false&clickAnalytics=false&facets=batch&hitsPerPage=0&maxValuesPerFacet=1000&page=0&query=',
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.results[0].hits;
}

async function fetchYCCompanies() {
  try {
    const allCompanies: YCCompanyFull[] = [];
    const batches = [
      'F24',
      'S24',
      'W24',
      'S23',
      'W23',
      'S22',
      'W22',
      'S21',
      'W21',
      'S20',
      'W20',
      'S19',
      'W19',
      'S18',
      'W18',
      'S17',
      'W17',
      'IK12',
      'S16',
      'W16',
      'S15',
      'W15',
      'S14',
      'W14',
      'S13',
      'W13',
      'S12',
      'W12',
      'S11',
      'W11',
      'S10',
      'W10',
      'S09',
      'W09',
      'S08',
      'W08',
      'S07',
      'W07',
      'S06',
      'W06',
      'S05',
    ];

    // Process batches in parallel with a concurrency limit
    const BATCH_SIZE = 5; // Number of concurrent requests
    for (let i = 0; i < batches.length; i += BATCH_SIZE) {
      const batchSlice = batches.slice(i, i + BATCH_SIZE);
      const promises = batchSlice.map((batch) => {
        console.log(`Fetching batch ${batch}...`);
        return fetchYCBatch(batch);
      });

      const results = await Promise.all(promises);
      results.forEach((companies) => {
        allCompanies.push(...companies);
      });

      console.log(`Processed ${allCompanies.length} companies so far...`);

      // Small delay between batch groups
      if (i + BATCH_SIZE < batches.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Save raw JSON data
    writeFileSync('yc-companies-raw.json', JSON.stringify(allCompanies, null, 2));

    // Convert to CSV
    const csvFields = [
      'id',
      'name',
      'batch',
      'website',
      'all_locations',
      'one_liner',
      'long_description',
      'team_size',
      'industry',
      'subindustry',
      'status',
      'isHiring',
      'stage',
      'tags',
      'regions',
      'industries',
    ];

    const csvData = allCompanies.map((company) => ({
      ...company,
      tags: company.tags?.join(';') || '',
      regions: company.regions?.join(';') || '',
      industries: company.industries?.join(';') || '',
    }));

    const csvString = stringify(csvData, {
      header: true,
      columns: csvFields,
    });

    writeFileSync('yc-companies.csv', csvString);

    console.log(`Successfully processed ${allCompanies.length} companies`);
    return allCompanies;
  } catch (error) {
    console.error('Error fetching YC companies:', error);
    throw error;
  }
}

// Main execution
const main = async () => {
  try {
    const results = await fetchYCCompanies();
    console.log(`Successfully processed ${results.length} companies`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Handle any unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Execute the main function
main().catch((error) => {
  console.error('Fatal error in main:', error);
  process.exit(1);
});
