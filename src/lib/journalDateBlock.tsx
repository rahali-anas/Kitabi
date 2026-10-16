import { createReactBlockSpec } from '@blocknote/react';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const parts = iso.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '—';
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export const JournalDateBlock = createReactBlockSpec(
  {
    type: 'journalDate' as const,
    propSchema: {
      iso: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const iso = props.block.props.iso;
      return (
        <div className="q-journal-date" contentEditable={false}>
          <span className="q-journal-date-rule" />
          <span className="q-journal-date-label">{formatDate(iso)}</span>
          <span className="q-journal-date-rule" />
        </div>
      );
    },
  }
);