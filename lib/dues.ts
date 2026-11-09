import { addMonths, monthRange, monthStart, todayBD } from './dates';

export type DuesInput = {
  joinDate: string;
  resetFrom?: string | null;
  monthlyAmount: number;
  paidMonths: string[]; // for_month তালিকা (YYYY-MM-01)
  dueDay: number;
};

export type Dues = {
  months: string[];
  paid: Set<string>;
  overdue: string[];
  streak: number;          // টানা বকেয়া মাস (ফ্রিজের হিসাব)
  dueAmount: number;
  paidThisMonth: boolean;
  nextDueDate: string;
};

/** ডেটাবেসের run_auto_freeze() এর মতো একই নিয়মে বকেয়া হিসাব (ওয়েবসাইট ও চ্যাটবটে ব্যবহারের জন্য) */
export function computeDues(i: DuesInput, today = todayBD()): Dues {
  const cur = monthStart(today);
  const day = Number(today.slice(8, 10));
  const months = monthRange(i.joinDate, today);
  const paid = new Set(i.paidMonths.map((m) => monthStart(m)));
  const isOverdue = (m: string) => !paid.has(m) && (m < cur || day > i.dueDay);
  const overdue = months.filter(isOverdue);

  const lower = i.resetFrom && monthStart(i.resetFrom) > monthStart(i.joinDate) ? monthStart(i.resetFrom) : monthStart(i.joinDate);
  let streak = 0;
  for (let k = months.length - 1; k >= 0; k--) {
    const m = months[k];
    if (m < lower || paid.has(m)) break;
    if (m === cur && day <= i.dueDay) continue;
    streak++;
  }
  const paidThisMonth = paid.has(cur);
  const dd = String(i.dueDay).padStart(2, '0');
  const nextDueDate = (paidThisMonth ? addMonths(cur, 1) : cur).slice(0, 8) + dd;
  return { months, paid, overdue, streak, dueAmount: overdue.length * i.monthlyAmount, paidThisMonth, nextDueDate };
}
