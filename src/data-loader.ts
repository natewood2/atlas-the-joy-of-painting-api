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

async function loadColorData() {
  const records: any[] = [];
  const parser = fs
    .createReadStream(path.join(__dirname, '../data/The Joy Of Painiting - Colors Used'))
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

      const colors = JSON.parse(record.colors.replace(/'/g, '"'));
      const colorCodes = JSON.parse(record.color_hex.replace(/'/g, '"'));

      for (let i = 0; i < colors.length; i++) {
        const colorResult = await pool.query(
          `INSERT INTO colors (name, hex_code)
          VALUES ($1, $2)
          ON CONFLICT (name, hex_code) DO UPDATE
          SET name = EXCLUDED.name
          RETURNING id`,
          [colors[i].trim(), colorCodes[i]]
        );

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

async function loadSubjectData() {
  const parser = fs
    .createReadStream(path.join(__dirname, '../data/The Joy Of Painiting - Subject Matter'))
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  for await (const record of parser) {
    const episodeParts = record.EPISODE.match(/S(\d+)E(\d+)/);
    if (!episodeParts) {
      console.log('Could not parse episode:', record.EPISODE);
      continue;
    }

    const season = parseInt(episodeParts[1]);
    const episode = parseInt(episodeParts[2]);

    const episodeResult = await pool.query(
      'SELECT id, episode_number FROM episodes WHERE season = $1 AND episode = $2',
      [season, episode]
    );

    if (episodeResult.rows.length > 0) {
      const episodeId = episodeResult.rows[0].id;
      
      for (const [key, value] of Object.entries(record)) {
        if (value === '1' && key !== 'EPISODE' && key !== 'TITLE') {
          const subjectName = key.toLowerCase().replace(/_/g, ' ').replace(/^\*/, '');
          
          const elementResult = await pool.query(
            'INSERT INTO elements (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
            [subjectName]
          );

          await pool.query(
            'INSERT INTO episode_elements (episode_id, element_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [episodeId, elementResult.rows[0].id]
          );
        }
      }
    }
  }
}

// Load air dates
async function loadAirDates() {
  const parser = fs
    .createReadStream(path.join(__dirname, '../data/The Joy Of Painting - Episode Dates'))
    .pipe(parse({
      columns: false,
      skip_empty_lines: true,
      trim: true
    }));

  for await (const record of parser) {
    try {
      const titleMatch = record[0].match(/"([^"]+)"/);
      const dateMatch = record[0].match(/\((.*?)\)/);
      
      if (titleMatch && dateMatch) {
        const title = titleMatch[1];
        const airDate = new Date(dateMatch[1]);
        
        await pool.query(
          `UPDATE episodes 
           SET air_date = $1
           WHERE title = $2`,
          [airDate, title]
        );
        
        console.log(`Updated air date for "${title}"`);
      }
    } catch (err) {
      console.error(`Error processing air date record:`, record, err);
    }
  }
}

async function loadAllData() {
  try {
    await loadColorData();
    await loadSubjectData();
    await loadAirDates();
    console.log('All data imported successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

loadAllData();

export { pool };