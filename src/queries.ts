import { FilterOptions } from './types';

export const buildFilterQuery = (filters: FilterOptions) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (filters.subjects?.length) {
    conditions.push(`EXISTS (
      SELECT 1 FROM episode_elements ee
      JOIN elements el ON ee.element_id = el.id
      WHERE ee.episode_id = e.id AND el.name = ANY($${paramCount})
    )`);
    values.push(filters.subjects);
    paramCount++;
  }

  if (filters.colors?.length) {
    conditions.push(`EXISTS (
      SELECT 1 FROM episode_colors ec
      JOIN colors c ON ec.color_id = c.id
      WHERE ec.episode_id = e.id AND c.name = ANY($${paramCount})
    )`);
    values.push(filters.colors);
    paramCount++;
  }

  if (filters.months?.length) {
    conditions.push(`EXTRACT(MONTH FROM e.air_date) = ANY($${paramCount})`);
    values.push(filters.months);
    paramCount++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(filters.matchAll ? ' AND ' : ' OR ')}`
    : '';

  return {
    text: `
      SELECT e.*,
        array_agg(DISTINCT c.name) as colors,
        array_agg(DISTINCT el.name) as subjects
      FROM episodes e
      LEFT JOIN episode_colors ec ON e.id = ec.episode_id
      LEFT JOIN colors c ON ec.color_id = c.id
      LEFT JOIN episode_elements ee ON e.id = ee.episode_id
      LEFT JOIN elements el ON ee.element_id = el.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.episode_number
    `,
    values
  };
};