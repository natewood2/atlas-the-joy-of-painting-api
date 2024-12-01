import { Pool, QueryResult } from 'pg';
import { parse } from 'csv-parse'; // not used
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'joy_of_painting',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function loadAirDates() {
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, '../data/The Joy Of Painting - Episode Dates'),
      'utf-8'
    );

    const lines = fileContent.split('\n').filter(line => line.trim());
    console.log('Starting to process air dates...');
    let updateCount = 0;
    let failCount = 0;

    for (const line of lines) {
      try {
        const titleMatch = line.match(/"([^"]+)"/);
        const dateMatch = line.match(/\((.*?)\)/);

        if (titleMatch && dateMatch) {
          const title = titleMatch[1].trim();
          const dateStr = dateMatch[1].trim();
          const airDate = new Date(dateStr);

          const result: QueryResult = await pool.query(
            `UPDATE episodes 
             SET air_date = $1
             WHERE LOWER(title) = LOWER($2)
                OR LOWER(title) = LOWER(REPLACE($2, 'Mount', 'Mt.'))
                OR LOWER(title) LIKE LOWER($2 || '%')
             RETURNING title, air_date`,
            [airDate, title]
          );

          if (result && result.rowCount && result.rowCount > 0) {
            console.log(`✅ Updated "${title}" with date ${dateStr}`);
            updateCount++;
          } else {
            console.log(`❌ No match found for "${title}"`);
            failCount++;
          }
        }
      } catch (err) {
        console.error(`Error processing line: ${line}`, err);
        failCount++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Successfully updated: ${updateCount} episodes`);
    console.log(`Failed updates: ${failCount} episodes`);

    const verifyResult: QueryResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(air_date) as with_dates,
             COUNT(*) FILTER (WHERE air_date IS NULL) as without_dates
      FROM episodes
    `);
    
    console.log('\n=== Database Status ===');
    console.log(`Total episodes: ${verifyResult.rows[0].total}`);
    console.log(`Episodes with dates: ${verifyResult.rows[0].with_dates}`);
    console.log(`Episodes without dates: ${verifyResult.rows[0].without_dates}`);

  } catch (err) {
    console.error('Failed to process air dates:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  loadAirDates().catch(console.error);
}

export { loadAirDates };
