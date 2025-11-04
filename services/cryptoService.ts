
import { RemoteEncryptedPayload } from '../types';

// Helper to convert ArrayBuffer to Base64 string
const ab2b64 = (buf: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper to convert Base64 string to ArrayBuffer
const b642ab = (b64: string): ArrayBuffer => {
  const binary_string = window.atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};


const getCryptoKey = async (password: string, salt: string): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

export const encryptData = async (data: object, passphrase: string, salt: string): Promise<string> => {
    const key = await getCryptoKey(passphrase, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for AES-GCM
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encodedData
    );

    // Prepend IV to ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return ab2b64(combined.buffer);
};


export const decryptData = async (encryptedBase64: string, passphrase: string, salt: string): Promise<any> => {
    const key = await getCryptoKey(passphrase, salt);
    const combined = b642ab(encryptedBase64);

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(iv)
        },
        key,
        ciphertext
    );

    const dec = new TextDecoder();
    const decryptedString = dec.decode(decrypted);
    return JSON.parse(decryptedString);
};

// --- New functions for remote storage API ---

interface EncryptedParts {
    nonce: string; // base64
    ciphertext: string; // base64
}

export const encryptForRemote = async (data: object, passphrase: string, salt: string): Promise<EncryptedParts> => {
    const key = await getCryptoKey(passphrase, salt);
    const nonce = window.crypto.getRandomValues(new Uint8Array(12)); // GCM standard nonce size
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: nonce
        },
        key,
        encodedData
    );

    return {
        nonce: ab2b64(nonce.buffer),
        ciphertext: ab2b64(ciphertextBuffer),
    };
};


export const decryptFromRemote = async (encrypted: RemoteEncryptedPayload, passphrase: string): Promise<any> => {
    const key = await getCryptoKey(passphrase, encrypted.salt);
    const nonce = b642ab(encrypted.nonce);
    const ciphertext = b642ab(encrypted.ciphertext);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(nonce)
        },
        key,
        ciphertext
    );

    const dec = new TextDecoder();
    const decryptedString = dec.decode(decrypted);
    return JSON.parse(decryptedString);
};
