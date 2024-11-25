import { Pool } from 'pg';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'joy_of_painting',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function loadData(filePath: string) {
  const records: any[] = [];
  const parser = fs
    .createReadStream(path.join('data', filePath))
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      quote: '"',
      escape: '\\'
    }));

  for await (const record of parser) {
    records.push(record);
  }

  for (const record of records) {
    try {
      // Insert episode
      const episodeResult = await pool.query(
        `INSERT INTO episodes (
          episode_number, title, season, episode, 
          youtube_url, painting_image_url
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT (episode_number) DO UPDATE 
        SET title = EXCLUDED.title
        RETURNING id`,
        [
          record.painting_index,
          record.painting_title,
          record.season,
          record.episode,
          record.youtube_src,
          record.img_src
        ]
      );

      // Parse colors array from string
      const colors = JSON.parse(record.colors.replace(/'/g, '"'));
      const colorCodes = JSON.parse(record.color_hex.replace(/'/g, '"'));

      // Insert colors
      for (let i = 0; i < colors.length; i++) {
        const colorResult = await pool.query(
          `INSERT INTO colors (name, hex_code) 
           VALUES ($1, $2) 
           ON CONFLICT (name, hex_code) DO UPDATE 
           SET name = EXCLUDED.name 
           RETURNING id`,
          [colors[i].trim(), colorCodes[i]]
        );

        // Link color to episode
        await pool.query(
          `INSERT INTO episode_colors (episode_id, color_id) 
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [episodeResult.rows[0].id, colorResult.rows[0].id]
        );
      }

      console.log(`Processed episode ${record.painting_index}`);
    } catch (err) {
      console.error(`Error processing record:`, record, err);
    }
  }
}

async function main() {
  try {
    await loadData('The Joy Of Painiting - Colors Used');
    console.log('Data import completed');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();