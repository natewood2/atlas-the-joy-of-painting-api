import { Pool } from 'pg';
import { parse } from 'csv-parse';
import fs from 'fs';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joy_of_painting',
  password: '',
  port: 5432
});

async function insertSubjectData(filePath: string) {
  const records = [];
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  for await (const record of parser) {
    console.log('Processing record:', record);

    const episodeParts = record.EPISODE.match(/S(\d+)E(\d+)/);
    if (!episodeParts) {
      console.log('Could not parse episode:', record.EPISODE);
      continue;
    }

    const season = parseInt(episodeParts[1]);
    const episode = parseInt(episodeParts[2]);
    
    // Get episode number from database
    const episodeResult = await pool.query(
      'SELECT id, episode_number FROM episodes WHERE season = $1 AND episode = $2',
      [season, episode]
    );
    
    console.log('Episode found:', episodeResult.rows[0]);

    if (episodeResult.rows.length > 0) {
      const episodeId = episodeResult.rows[0].id;
      
      for (const [key, value] of Object.entries(record)) {
        if (value === '1' && key !== 'EPISODE' && key !== 'TITLE') {
          const subjectName = key.toLowerCase().replace(/_/g, ' ').replace(/^\*/, '');
          
          console.log('Adding subject:', subjectName);

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

async function main() {
  try {
    await insertSubjectData('./data/The Joy Of Painiting - Subject Matter');
    console.log('Subject data imported successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();