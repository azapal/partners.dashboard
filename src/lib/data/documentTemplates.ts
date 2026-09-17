/**
 * Azapal's own invoice/receipt designs.
 *
 * Only the key is persisted (PartnerDocumentBranding.template), so a preset can be
 * restyled here without touching a single partner's saved settings. A partner's own
 * accent colour overrides the preset's; their watermark sits behind whatever the
 * preset draws.
 */
import { BRAND_NAVY, BRAND_ORANGE } from '../brandColors';

export type DocumentTemplateKey = 'plain' | 'classic' | 'modern' | 'bold';

export interface DocumentTemplate {
  key: DocumentTemplateKey;
  name: string;
  description: string;
  /** Headings, totals and rules. Overridden by the partner's accent_color. */
  accent: string;
  /** Letterhead treatment. `band` fills it, `rule` underlines it, `none` is bare. */
  header: 'none' | 'rule' | 'band';
  /** Whether the header band's text needs to invert for contrast. */
  headerText: 'dark' | 'light';
  /** Tint behind the totals block; empty means no tint. */
  totalsTint: string;
  uppercaseHeadings: boolean;
}

export const DOCUMENT_TEMPLATES: Record<DocumentTemplateKey, DocumentTemplate> = {
  plain: {
    key: 'plain',
    name: 'Plain',
    description: 'Unstyled and print-safe. Best if you use your own template sheet.',
    accent: '#111827',
    header: 'rule',
    headerText: 'dark',
    totalsTint: '',
    uppercaseHeadings: false,
  },
  classic: {
    key: 'classic',
    name: 'Classic',
    description: 'Formal letterhead with a ruled header and tinted totals.',
    accent: BRAND_NAVY,
    header: 'rule',
    headerText: 'dark',
    totalsTint: '#f1f5f9',
    uppercaseHeadings: true,
  },
  modern: {
    key: 'modern',
    name: 'Modern',
    description: 'Azapal orange accents on a clean, airy layout.',
    accent: BRAND_ORANGE,
    header: 'rule',
    headerText: 'dark',
    totalsTint: '#fff7ed',
    uppercaseHeadings: false,
  },
  bold: {
    key: 'bold',
    name: 'Bold',
    description: 'Full-width coloured header. Stands out in a crowded inbox.',
    accent: BRAND_NAVY,
    header: 'band',
    headerText: 'light',
    totalsTint: '#f1f5f9',
    uppercaseHeadings: true,
  },
};

export const DOCUMENT_TEMPLATE_LIST = Object.values(DOCUMENT_TEMPLATES);
