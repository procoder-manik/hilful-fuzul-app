export type Role = 'member' | 'treasurer' | 'librarian' | 'editor' | 'admin';
export type MemberStatus = 'active' | 'frozen' | 'cancelled';

export type Settings = {
  id: number; org_name: string; short_name: string | null; tagline: string | null; established: string | null;
  address: string | null; phone: string | null; email: string | null; whatsapp: string | null; facebook: string | null;
  logo_url: string | null; reg_fee: number; due_day: number; freeze_months: number; show_borrower_names: boolean; members_page_on?: boolean; members_show_money?: boolean;
  theme: { skin?: string }; home_sections: { k: string; on: boolean }[]; hero: Record<string, string>;
  ticker: string[]; member_terms: string[]; loan_terms: string[]; pay_info: string | null; quran_info: string | null;
  phone2?: string | null; youtube?: string | null; map_url?: string | null; office_hours?: string | null;
  header_cfg: Record<string, unknown>; footer_cfg: Record<string, unknown>;
  pay_methods: PayMethod[]; notify_email: boolean; notify_sms: boolean; notify_last_run: string | null;
  chat_enabled: boolean; chat_provider: 'gemini' | 'openrouter'; chat_model: string | null; chat_notes: string | null;
};

export type PayMethod = { kind: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'cash' | 'other'; label: string; number: string; note: string };

export type Application = {
  id: string; app_no: number; name: string; father_name: string | null; mother_name: string | null; phone: string; email: string | null;
  nid: string | null; dob: string | null; address: string | null; occupation: string | null; nominee: string | null; monthly_amount: number | null;
  photo_url: string | null; signature_url: string | null; status: 'pending' | 'approved' | 'rejected'; member_id: string | null;
  user_id: string | null; pay_method: string | null; pay_trx: string | null; pay_claimed_at: string | null; created_at: string;
};

export type Member = {
  id: string; member_no: string; name: string; father_name: string | null; mother_name: string | null; email: string | null; verified_at: string | null; phone: string; nid: string | null;
  dob: string | null; address: string | null; occupation: string | null; nominee: string | null;
  photo_url: string | null; signature_url: string | null; monthly_amount: number; join_date: string;
  status: MemberStatus; reset_from: string | null; frozen_at: string | null;
};

export type Payment = {
  id: string; member_id: string; type: 'registration' | 'monthly' | 'reactivation'; for_month: string | null;
  amount: number; paid_on: string; method: string | null; receipt_no: string;
};

export type Loan = {
  id: string; slip_no: string; member_id: string; amount: number; term_months: 3 | 6 | 12; mode: 'lump' | 'installment';
  issued_on: string; due_on: string; guarantor_name: string; guarantor_phone: string | null; purpose: string | null;
  loan_repayments?: { amount: number; paid_on: string }[];
};

export type PublicStats = {
  total_fund: number; total_contributions: number; total_donations: number; total_loaned: number; total_repaid: number;
  month_collected: number; month_loaned: number; members: number; active_members: number; borrowers: number;
  program_beneficiaries: number; books: number; book_titles: number;
};
