import chalk from 'chalk';
import Table from 'cli-table3';

const formatEpisodeOutput = (rows: any[]) => {
  // Create a more compact table with better column widths
  const table = new Table({
    head: [
      chalk.bold.cyan('Episode'),
      chalk.bold.cyan('Title'),
      chalk.bold.cyan('Season'),
      chalk.bold.cyan('Colors'),
      chalk.bold.cyan('Subjects')
    ],
    wordWrap: true,
    wrapOnWordBoundary: true,
    colWidths: [10, 25, 8, 25, 25],
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
    table.push([
      chalk.yellow(row.episode_number),
      chalk.white(row.title),
      chalk.green(`S${row.season}E${row.episode}`),
      chalk.magenta(formatList(row.colors, 2)),
      chalk.blue(formatList(row.subjects, 2))
    ]);
  });

  // Add header and footer
  console.log(chalk.bold.blue('\n🎨 The Joy of Painting Episodes'));
  console.log(chalk.gray('─'.repeat(93)));
  console.log(table.toString());
  console.log(chalk.gray('─'.repeat(93)));
  console.log(chalk.yellow(`Total Episodes: ${rows.length}`));
  console.log(chalk.gray(`Generated: ${new Date().toLocaleString()}\n`));
};

// Helper function to format lists more concisely
const formatList = (items: string[], maxItems: number): string => {
  if (!items || items.length === 0) return '';
  const displayed = items.slice(0, maxItems);
  return displayed.join(', ') + (items.length > maxItems ? '...' : '');
};

export default formatEpisodeOutput;