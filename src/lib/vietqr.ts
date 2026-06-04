// =============================================================================
// VietQR helpers
// -----------------------------------------------------------------------------
// Builds a VietQR "Quick Link" image URL (img.vietqr.io) so the admin can scan
// it from a banking app instead of typing the account number + amount by hand.
//
// Quick Link is free and needs no API key — the bank logo, amount and transfer
// memo are all rendered into the returned PNG by VietQR.io.
// Format: https://img.vietqr.io/image/{BIN}-{ACCOUNT}-{template}.png?amount=&addInfo=&accountName=
// =============================================================================

const VIETQR_IMAGE_BASE = 'https://img.vietqr.io/image';

export type VietQrTemplate = 'compact' | 'compact2' | 'qr_only' | 'print';

export interface VietQrParams {
  /** 6-digit NAPAS BIN of the receiving bank. */
  bankBin: string;
  /** Receiving account number. */
  accountNumber: string;
  /** Transfer amount in VND (integer). Omit/0 to let the payer enter it. */
  amount?: number;
  /** Account holder name (shown for the payer to verify). */
  accountName?: string;
  /** Transfer memo / content. */
  addInfo?: string;
  /** VietQR template — defaults to compact2 (logo + amount + info). */
  template?: VietQrTemplate;
}

/**
 * Strip Vietnamese diacritics and uppercase — bank transfer memos and holder
 * names are expected in plain ASCII, and accented text can break some apps.
 */
export function toAsciiUpper(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .trim();
}

/** Build the img.vietqr.io Quick Link image URL for the given transfer. */
export function buildVietQrImageUrl({
  bankBin,
  accountNumber,
  amount,
  accountName,
  addInfo,
  template = 'compact2',
}: VietQrParams): string {
  const base = `${VIETQR_IMAGE_BASE}/${encodeURIComponent(bankBin)}-${encodeURIComponent(
    accountNumber
  )}-${template}.png`;

  const params = new URLSearchParams();
  if (amount && amount > 0) params.set('amount', String(Math.round(amount)));
  if (addInfo) params.set('addInfo', toAsciiUpper(addInfo));
  if (accountName) params.set('accountName', toAsciiUpper(accountName));

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
