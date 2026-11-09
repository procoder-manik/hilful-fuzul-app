'use client';
import { BarElement, CategoryScale, Chart as ChartJS, ArcElement, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { bn as fbn } from '@/lib/format';
import { useLang } from './LangProvider';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend);
ChartJS.defaults.font.family = "'Hind Siliguri', sans-serif";

const ACC = '#0e5a43', GOLD = '#e8b44a', BLUE = '#1673e6';

/** বর্তমান ভাষা অনুযায়ী সংখ্যা ও টাকার ফরম্যাট */
function useFmt() {
  const lang = useLang();
  const bn = (x: number | string) => fbn(x, lang);
  const tk = (n: number) => '৳' + bn(Math.round(n).toLocaleString('en-IN'));
  return { lang, bn, tk, t: (b: string, e: string) => (lang === 'en' ? e : b) };
}
const moneyOpts = (f: ReturnType<typeof useFmt>) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c: { dataset: { label?: string }; parsed: { y: number } }) => ` ${c.dataset.label}: ${f.tk(c.parsed.y)}` } } },
  scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v: string | number) => f.bn(Number(v) >= 1000 ? Number(v) / 1000 + f.t('হা', 'k') : v) } } },
});

export function CollectionChart({ labels, collected, loaned, repaid }: { labels: string[]; collected: number[]; loaned: number[]; repaid: number[] }) {
  const f = useFmt();
  return (
    <div className="chart-box">
      <Bar
        options={moneyOpts(f) as never}
        data={{
          labels,
          datasets: [
            { label: f.t('সংগ্রহ', 'Collected'), data: collected, backgroundColor: ACC, borderRadius: 8, maxBarThickness: 26 },
            { label: f.t('ঋণ বিতরণ', 'Loans given'), data: loaned, backgroundColor: GOLD, borderRadius: 8, maxBarThickness: 26 },
            { type: 'line' as never, label: f.t('ঋণ ফেরত', 'Repaid'), data: repaid, borderColor: BLUE, backgroundColor: BLUE, tension: 0.4, pointRadius: 3 } as never,
          ],
        }}
      />
    </div>
  );
}

export function MembersChart({ labels, members }: { labels: string[]; members: number[] }) {
  const f = useFmt();
  return (
    <div className="chart-box">
      <Line
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v) => f.bn(v) } } } }}
        data={{ labels, datasets: [{ label: f.t('মোট সদস্য', 'Total members'), data: members, borderColor: ACC, backgroundColor: 'rgba(14,90,67,.12)', fill: true, tension: 0.4 }] }}
      />
    </div>
  );
}

export function DonutChart({ labels, values, colors, isMoney }: { labels: string[]; values: number[]; colors: string[]; isMoney?: boolean }) {
  const f = useFmt();
  return (
    <div className="chart-box" style={{ height: 230 }}>
      <Doughnut
        options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${isMoney ? f.tk(c.parsed) : f.bn(c.parsed)}` } } } }}
        data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }}
      />
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="chart-box" style={{ height: 90, margin: '10px -6px 0' }}>
      <Line
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }}
        data={{ labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: ACC, backgroundColor: 'rgba(14,90,67,.12)', fill: true, tension: 0.45, pointRadius: 0 }] }}
      />
    </div>
  );
}
