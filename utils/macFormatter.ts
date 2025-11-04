
import { MacFormat } from '../types';

export const normalizeMac = (mac: string): string => {
  return mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase().substring(0, 12);
};

export const formatMac = (normalizedMac: string, format: MacFormat): string => {
  if (normalizedMac.length !== 12) {
    return normalizedMac;
  }

  switch (format) {
    case MacFormat.HYPHEN:
      return normalizedMac.match(/.{1,2}/g)?.join('-') || normalizedMac;
    case MacFormat.COLON:
      return normalizedMac.match(/.{1,2}/g)?.join(':') || normalizedMac;
    case MacFormat.DOT:
      return normalizedMac.match(/.{1,4}/g)?.join('.') || normalizedMac;
    case MacFormat.NONE:
      return normalizedMac;
    default:
      return normalizedMac;
  }
};

export const isValidMac = (normalizedMac: string): boolean => {
    return normalizedMac.length === 12 && /^[0-9A-F]{12}$/.test(normalizedMac);
}
