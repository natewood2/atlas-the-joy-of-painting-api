import express from 'express';
import { pool } from './db';
import { buildFilterQuery } from './queries';
import { FilterOptions } from './types';
import chalk from 'chalk';
import Table from 'cli-table3';

const app = express();
app.use(express.json());

const formatEpisodeOutput = (rows: any[]) => {
  const table = new Table({
    head: [
      chalk.bold.cyan('Episode'),
      chalk.bold.cyan('Title'),
      chalk.bold.cyan('Season'),
      chalk.bold.cyan('Air Date'),
      chalk.bold.cyan('Colors'),
      chalk.bold.cyan('Subjects')
    ],
    wordWrap: true,
    wrapOnWordBoundary: true,
    colWidths: [10, 25, 8, 12, 25, 25],
    style: {
      head: [],
      border: ['grey'],
      compact: true
    },
    chars: {
      'top': '═',
      'top-mid': '╤',
      'top-left': '╔',
      'top-right': '╗',
      'bottom': '═',
      'bottom-mid': '╧',
      'bottom-left': '╚',
      'bottom-right': '╝',
      'left': '║',
      'left-mid': '╟',
      'right': '║',
      'right-mid': '╢',
      'mid': '─',
      'mid-mid': '┼',
      'middle': '│'
    }
  });

  rows.forEach(row => {
    const formattedDate = row.air_date 
      ? new Date(row.air_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'N/A';

    table.push([
      chalk.yellow(row.episode_number),
      chalk.white(row.title),
      chalk.green(`S${row.season}E${row.episode}`),
      chalk.cyan(formattedDate),
      chalk.magenta(row.colors.slice(0, 2).join(', ') + (row.colors.length > 2 ? '...' : '')),
      chalk.blue(row.subjects.slice(0, 2).join(', ') + (row.subjects.length > 2 ? '...' : ''))
    ]);
  });

  console.log(chalk.bold.blue('\n🎨 The Joy of Painting Episodes'));
  console.log(chalk.gray('─'.repeat(105)));
  console.log(table.toString());
  console.log(chalk.gray('─'.repeat(105)));
  console.log(chalk.yellow(`Total Episodes: ${rows.length}`));
  console.log(chalk.gray(`Generated: ${new Date().toLocaleString()}\n`));
};

app.get('/episodes', async (req, res) => {
  try {
    const filters: FilterOptions = {};
    
    // color parse
    if (req.query.colors) {
      filters.colors = Array.isArray(req.query.colors)
        ? req.query.colors.map(c => String(c))
        : [String(req.query.colors)];
    }

    // subject (not working 100%)
    if (req.query.subjects) {
      filters.subjects = Array.isArray(req.query.subjects)
        ? req.query.subjects.map(s => String(s))
        : [String(req.query.subjects)];
    }

    // months
    if (req.query.months) {
      filters.months = Array.isArray(req.query.months)
        ? req.query.months.map(m => parseInt(String(m)))
        : [parseInt(String(req.query.months))];
    }

    // matchAll
    filters.matchAll = req.query.matchAll === 'true';

    const query = buildFilterQuery(filters);
    const result = await pool.query(query);
    
    formatEpisodeOutput(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(chalk.red('Error:', err));
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(chalk.green(`✨ Server running on port ${PORT}`));
});

export default app;
