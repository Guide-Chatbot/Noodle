import QRCode from 'qrcode';

/**
 * Standard CRC16-CCITT for EMVCo QR Code
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Generates an authentic Thai PromptPay EMVCo QR Payload
 * @param target Mobile number (e.g. "0891234567") or National ID / Tax ID (13 digits)
 * @param amount Optional transaction amount in THB (e.g. 125.00)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const sanitizedTarget = target.replace(/[^0-9]/g, '');
  let subTagValue = '';

  if (sanitizedTarget.length === 10 && sanitizedTarget.startsWith('0')) {
    // Mobile number format: 0066 + 9 digits without leading 0
    const mobileFormatted = '0066' + sanitizedTarget.substring(1);
    subTagValue = formatTag('01', mobileFormatted);
  } else if (sanitizedTarget.length === 13) {
    // Thai National ID or Tax ID
    subTagValue = formatTag('02', sanitizedTarget);
  } else {
    // Default fallback to mobile
    const mobile = sanitizedTarget.padStart(10, '0');
    subTagValue = formatTag('01', '0066' + mobile.substring(1));
  }

  // Tag 29: Merchant Account Information
  const aidTag = formatTag('00', 'A000000677010111');
  const tag29Value = aidTag + subTagValue;
  const tag29 = formatTag('29', tag29Value);

  // Payload segments
  let payload = '';
  payload += formatTag('00', '01'); // Format indicator
  payload += formatTag('01', amount !== undefined && amount > 0 ? '12' : '11'); // 12 = dynamic, 11 = static
  payload += tag29;
  payload += formatTag('53', '764'); // Currency: THB

  if (amount !== undefined && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }

  payload += formatTag('58', 'TH'); // Country code

  // Tag 63: CRC placeholder
  const payloadWithCrcTag = payload + '6304';
  const checksum = crc16(payloadWithCrcTag);

  return payloadWithCrcTag + checksum;
}

/**
 * Converts PromptPay payload or any text into a high resolution DataURL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}
