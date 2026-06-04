// =============================================================================
// Vietnamese banks (NAPAS / VietQR)
// -----------------------------------------------------------------------------
// Static list of banks supported by VietQR, sourced from the public
// https://api.vietqr.io/v2/banks dataset. Bundled (not fetched) so the bank
// picker works offline and never adds a runtime dependency.
//
// `bin` is the 6-digit NAPAS code required to build a VietQR — it also selects
// the bank logo shown inside the generated QR image.
// =============================================================================

export interface VietnamBank {
  /** 6-digit NAPAS BIN — used in the VietQR image URL. */
  bin: string;
  /** Short machine code, e.g. "VCB". */
  code: string;
  /** Brand short name shown in the dropdown, e.g. "Vietcombank". */
  shortName: string;
  /** Full legal name. */
  name: string;
}

// Ordered with the most commonly-used retail banks first so the picker is fast
// to scan; the rest follow. Keep `bin` values in sync with api.vietqr.io.
export const VIETNAM_BANKS: VietnamBank[] = [
  { bin: '970436', code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { bin: '970415', code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
  { bin: '970418', code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
  { bin: '970407', code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { bin: '970422', code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội' },
  { bin: '970416', code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970437', code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh' },
  { bin: '970448', code: 'OCB', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970441', code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970443', code: 'SHB', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970431', code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { bin: '970426', code: 'MSB', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { bin: '970440', code: 'SEAB', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '970449', code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970429', code: 'SCB', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  { bin: '970409', code: 'BAB', shortName: 'BacABank', name: 'Ngân hàng TMCP Bắc Á' },
  { bin: '970412', code: 'PVCB', shortName: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  { bin: '970419', code: 'NCB', shortName: 'NCB', name: 'Ngân hàng TMCP Quốc Dân' },
  { bin: '970424', code: 'SHBVN', shortName: 'ShinhanBank', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam' },
  { bin: '970425', code: 'ABB', shortName: 'ABBANK', name: 'Ngân hàng TMCP An Bình' },
  { bin: '970427', code: 'VAB', shortName: 'VietABank', name: 'Ngân hàng TMCP Việt Á' },
  { bin: '970428', code: 'NAB', shortName: 'NamABank', name: 'Ngân hàng TMCP Nam Á' },
  { bin: '970430', code: 'PGB', shortName: 'PGBank', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển' },
  { bin: '970433', code: 'VIETBANK', shortName: 'VietBank', name: 'Ngân hàng TMCP Việt Nam Thương Tín' },
  { bin: '970438', code: 'BVB', shortName: 'BaoVietBank', name: 'Ngân hàng TMCP Bảo Việt' },
  { bin: '970454', code: 'VCCB', shortName: 'BVBank', name: 'Ngân hàng TMCP Bản Việt' },
  { bin: '970446', code: 'COOPBANK', shortName: 'COOPBANK', name: 'Ngân hàng Hợp tác xã Việt Nam' },
  { bin: '970452', code: 'KLB', shortName: 'KienLongBank', name: 'Ngân hàng TMCP Kiên Long' },
  { bin: '970400', code: 'SGICB', shortName: 'SaigonBank', name: 'Ngân hàng TMCP Sài Gòn Công Thương' },
  { bin: '970408', code: 'GPB', shortName: 'GPBank', name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu' },
  { bin: '970406', code: 'Vikki', shortName: 'Vikki (DongABank)', name: 'Ngân hàng TNHH MTV Số Vikki' },
  { bin: '970414', code: 'MBV', shortName: 'MBV (OceanBank)', name: 'Ngân hàng TNHH MTV Việt Nam Hiện Đại' },
  { bin: '970444', code: 'CBB', shortName: 'CBBank', name: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam' },
  { bin: '970442', code: 'HLBVN', shortName: 'HongLeong', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam' },
  { bin: '970421', code: 'VRB', shortName: 'VRB', name: 'Ngân hàng Liên doanh Việt - Nga' },
  { bin: '970434', code: 'IVB', shortName: 'IndovinaBank', name: 'Ngân hàng TNHH Indovina' },
  { bin: '970410', code: 'SCVN', shortName: 'Standard Chartered', name: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam' },
  { bin: '970439', code: 'PBVN', shortName: 'PublicBank', name: 'Ngân hàng TNHH MTV Public Việt Nam' },
  { bin: '970457', code: 'WVN', shortName: 'Woori', name: 'Ngân hàng TNHH MTV Woori Việt Nam' },
  { bin: '970458', code: 'UOB', shortName: 'United Overseas Bank', name: 'Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh' },
  { bin: '458761', code: 'HSBC', shortName: 'HSBC', name: 'Ngân hàng TNHH MTV HSBC (Việt Nam)' },
  { bin: '422589', code: 'CIMB', shortName: 'CIMB', name: 'Ngân hàng TNHH MTV CIMB Việt Nam' },
];

/** Strip Vietnamese diacritics + non-alphanumerics for forgiving comparisons. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining accents
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const BANK_BY_BIN: Record<string, VietnamBank> = Object.fromEntries(
  VIETNAM_BANKS.map((b) => [b.bin, b])
);

/** Exact lookup by 6-digit BIN. */
export function findBankByBin(bin?: string | null): VietnamBank | undefined {
  if (!bin) return undefined;
  return BANK_BY_BIN[bin.trim()];
}

/**
 * Best-effort lookup used to recover a BIN for legacy withdrawal requests that
 * only stored a free-text bank name. Matches against shortName / code / name
 * after normalizing away diacritics, spacing and casing.
 */
export function findBankByName(bankName?: string | null): VietnamBank | undefined {
  if (!bankName) return undefined;
  const target = normalize(bankName);
  if (!target) return undefined;
  // Prefer an exact normalized match on shortName/code before falling back to
  // a contains-match so e.g. "VCB" / "Vietcombank" both resolve cleanly.
  return (
    VIETNAM_BANKS.find(
      (b) => normalize(b.shortName) === target || normalize(b.code) === target
    ) ??
    VIETNAM_BANKS.find(
      (b) =>
        target.includes(normalize(b.shortName)) ||
        normalize(b.name).includes(target) ||
        normalize(b.shortName).includes(target)
    )
  );
}
