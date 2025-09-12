import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export class CryptoUtil {
  private static readonly saltRounds = 10;
  private static readonly IV_LENGTH = 16; // AES IV

  // Usa clave de entorno (.env)
  private static readonly AES_SECRET =
    process.env.AES_SECRET_KEY || 'miClaveSuperSecreta1234567890123456';

  /** ---------------------------
   * 1) Hash (para clave SOL)
   * --------------------------- */
  static async hash(text: string): Promise<string> {
    return bcrypt.hash(text, this.saltRounds);
  }

  static async compare(text: string, hash: string): Promise<boolean> {
    return bcrypt.compare(text, hash);
  }

  /** ---------------------------
   * 2) AES Encrypt/Decrypt (para certificado digital)
   * --------------------------- */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_SECRET, 'utf-8').slice(0, 32),
      iv,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_SECRET, 'utf-8').slice(0, 32),
      iv,
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
