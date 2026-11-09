/** হেডার ও ফুটারের ডিজাইন-সেটিংস: ধরন, ডিফল্ট ও যাচাই (ক্লায়েন্ট ও সার্ভার দুই জায়গাতেই চলে) */
export type HeaderCfg = {
  layout: 'classic' | 'centered' | 'tworow' | 'floating'; band: 'soft' | 'accent' | 'plain'; sticky: boolean; height: number; shadow: boolean;
  bg: 'glass' | 'solid' | 'accent' | 'custom'; bgColor: string; textColor: string;
  logoSize: number; showLogo: boolean; showTagline: boolean; showShortNameOnMobile: boolean;
  navStyle: 'pill' | 'underline' | 'plain'; navAlign: 'left' | 'center' | 'right'; navSize: number;
  ctaOn: boolean; ctaLabel: string; ctaLabelEn: string; ctaUrl: string;
  showAccount: boolean; showTheme: boolean;
  topbarOn: boolean; topbarText: string; topbarTextEn: string; topbarBg: string; topbarColor: string; topbarContact: boolean;
};
export type FooterCfg = {
  style: 'columns' | 'centered' | 'minimal' | 'cta';
  ctaTitle: string; ctaTitleEn: string; ctaText: string; ctaTextEn: string; ctaBtn: string; ctaBtnEn: string; ctaUrl: string;
  customTitle: string; customTitleEn: string; customText: string; customTextEn: string;
  creditPrefix: string; creditPrefixEn: string; creditName: string; creditUrl: string;
  extraText: string; extraTextEn: string;
  bg: 'surface' | 'accent' | 'dark' | 'custom'; bgColor: string; textColor: string;
  showLogo: boolean; showAbout: boolean; aboutText: string; aboutTextEn: string;
  columns: 2 | 3 | 4;
  col1Title: string; col1TitleEn: string; col2Title: string; col2TitleEn: string; col3Title: string; col3TitleEn: string;
  showContact: boolean; showSocial: boolean; youtube: string; showLang: boolean;
  showBottomLinks: boolean; copyright: string; copyrightEn: string;
};

export const HEADER_DEFAULT: HeaderCfg = {
  layout: 'classic', band: 'soft', sticky: true, height: 62, shadow: false, bg: 'glass', bgColor: '#ffffff', textColor: '#13201b',
  logoSize: 40, showLogo: true, showTagline: true, showShortNameOnMobile: true,
  navStyle: 'pill', navAlign: 'right', navSize: 15,
  ctaOn: false, ctaLabel: 'সদস্য হোন', ctaLabelEn: 'Join us', ctaUrl: '/join',
  showAccount: true, showTheme: true,
  topbarOn: false, topbarText: 'মাদকমুক্ত যুবসমাজ, শিক্ষিত ও মানবিক সমাজ গড়াই আমাদের লক্ষ্য', topbarTextEn: 'Our goal is a drug-free, educated and humane society', topbarBg: '#0e5a43', topbarColor: '#ffffff', topbarContact: true,
};
export const FOOTER_DEFAULT: FooterCfg = {
  style: 'columns',
  ctaTitle: 'মাসে ৫০ টাকায় সমাজ বদলের অংশ হোন', ctaTitleEn: 'Be part of changing society for 50 taka a month', ctaText: 'সদস্য হয়ে বিপদে পড়া প্রতিবেশীর পাশে দাঁড়ান, প্রয়োজনে নিজেও বিনা সুদে ঋণ নিন।', ctaTextEn: 'Join to stand by neighbours in need, and borrow interest-free when you need it.', ctaBtn: 'সদস্য হোন', ctaBtnEn: 'Join us', ctaUrl: '/join',
  customTitle: '', customTitleEn: '', customText: '', customTextEn: '',
  creditPrefix: 'ওয়েবসাইট তৈরি করেছেন', creditPrefixEn: 'Developed by', creditName: '', creditUrl: '',
  extraText: '', extraTextEn: '',
  bg: 'surface', bgColor: '#0b2f24', textColor: '#ffffff',
  showLogo: true, showAbout: true, aboutText: '', aboutTextEn: '',
  columns: 4,
  col1Title: 'সংগঠন', col1TitleEn: 'Organisation', col2Title: 'সেবা', col2TitleEn: 'Services', col3Title: 'আরও', col3TitleEn: 'More',
  showContact: true, showSocial: true, youtube: '', showLang: true,
  showBottomLinks: true, copyright: '', copyrightEn: '',
};

const clamp = (n: unknown, lo: number, hi: number, d: number) => { const x = Number(n); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : d; };
const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (allowed.includes(v as T) ? (v as T) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const str = (v: unknown, d: string, max = 300) => (typeof v === 'string' ? v.slice(0, max) : d);
const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
/** শুধু নিজের সাইটের পথ বা https লিংক; javascript: ইত্যাদি বাদ */
export const safeUrl = (v: unknown, d = '#') => { const u = typeof v === 'string' ? v.trim().slice(0, 300) : ''; return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : d; };

export function headerCfg(raw: unknown): HeaderCfg {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>, d = HEADER_DEFAULT;
  return {
    layout: pick(r.layout, ['classic', 'centered', 'tworow', 'floating'], d.layout), band: pick(r.band, ['soft', 'accent', 'plain'], d.band), sticky: bool(r.sticky, d.sticky), height: clamp(r.height, 48, 110, d.height), shadow: bool(r.shadow, d.shadow),
    bg: pick(r.bg, ['glass', 'solid', 'accent', 'custom'], d.bg), bgColor: color(r.bgColor, d.bgColor), textColor: color(r.textColor, d.textColor),
    logoSize: clamp(r.logoSize, 28, 72, d.logoSize), showLogo: bool(r.showLogo, d.showLogo), showTagline: bool(r.showTagline, d.showTagline), showShortNameOnMobile: bool(r.showShortNameOnMobile, d.showShortNameOnMobile),
    navStyle: pick(r.navStyle, ['pill', 'underline', 'plain'], d.navStyle), navAlign: pick(r.navAlign, ['left', 'center', 'right'], d.navAlign), navSize: clamp(r.navSize, 12, 19, d.navSize),
    ctaOn: bool(r.ctaOn, d.ctaOn), ctaLabel: str(r.ctaLabel, d.ctaLabel, 40), ctaLabelEn: str(r.ctaLabelEn, d.ctaLabelEn, 40), ctaUrl: safeUrl(r.ctaUrl, d.ctaUrl),
    showAccount: bool(r.showAccount, d.showAccount), showTheme: bool(r.showTheme, d.showTheme),
    topbarOn: bool(r.topbarOn, d.topbarOn), topbarText: str(r.topbarText, d.topbarText, 160), topbarTextEn: str(r.topbarTextEn, d.topbarTextEn, 160),
    topbarBg: color(r.topbarBg, d.topbarBg), topbarColor: color(r.topbarColor, d.topbarColor), topbarContact: bool(r.topbarContact, d.topbarContact),
  };
}
export function footerCfg(raw: unknown): FooterCfg {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>, d = FOOTER_DEFAULT;
  return {
    style: pick(r.style, ['columns', 'centered', 'minimal', 'cta'], d.style),
    ctaTitle: str(r.ctaTitle, d.ctaTitle, 120), ctaTitleEn: str(r.ctaTitleEn, d.ctaTitleEn, 120), ctaText: str(r.ctaText, d.ctaText, 240), ctaTextEn: str(r.ctaTextEn, d.ctaTextEn, 240),
    ctaBtn: str(r.ctaBtn, d.ctaBtn, 40), ctaBtnEn: str(r.ctaBtnEn, d.ctaBtnEn, 40), ctaUrl: safeUrl(r.ctaUrl, d.ctaUrl),
    customTitle: str(r.customTitle, d.customTitle, 40), customTitleEn: str(r.customTitleEn, d.customTitleEn, 40), customText: str(r.customText, d.customText, 500), customTextEn: str(r.customTextEn, d.customTextEn, 500),
    creditPrefix: str(r.creditPrefix, d.creditPrefix, 60), creditPrefixEn: str(r.creditPrefixEn, d.creditPrefixEn, 60), creditName: str(r.creditName, d.creditName, 60), creditUrl: safeUrl(r.creditUrl, ''),
    extraText: str(r.extraText, d.extraText, 300), extraTextEn: str(r.extraTextEn, d.extraTextEn, 300),
    bg: pick(r.bg, ['surface', 'accent', 'dark', 'custom'], d.bg), bgColor: color(r.bgColor, d.bgColor), textColor: color(r.textColor, d.textColor),
    showLogo: bool(r.showLogo, d.showLogo), showAbout: bool(r.showAbout, d.showAbout), aboutText: str(r.aboutText, d.aboutText, 400), aboutTextEn: str(r.aboutTextEn, d.aboutTextEn, 400),
    columns: ([2, 3, 4].includes(Number(r.columns)) ? Number(r.columns) : d.columns) as 2 | 3 | 4,
    col1Title: str(r.col1Title, d.col1Title, 40), col1TitleEn: str(r.col1TitleEn, d.col1TitleEn, 40), col2Title: str(r.col2Title, d.col2Title, 40), col2TitleEn: str(r.col2TitleEn, d.col2TitleEn, 40),
    col3Title: str(r.col3Title, d.col3Title, 40), col3TitleEn: str(r.col3TitleEn, d.col3TitleEn, 40),
    showContact: bool(r.showContact, d.showContact), showSocial: bool(r.showSocial, d.showSocial), youtube: safeUrl(r.youtube, ''), showLang: bool(r.showLang, d.showLang),
    showBottomLinks: bool(r.showBottomLinks, d.showBottomLinks), copyright: str(r.copyright, d.copyright, 200), copyrightEn: str(r.copyrightEn, d.copyrightEn, 200),
  };
}
