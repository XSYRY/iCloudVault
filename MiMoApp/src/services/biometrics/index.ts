import ReactNativeBiometrics from 'react-native-biometrics';
import { logError } from '../../utils/logger';

const biometrics = new ReactNativeBiometrics();

export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    const { available, biometryType } = await biometrics.isSensorAvailable();
    return available && (biometryType === 'FaceID' || biometryType === 'TouchID' || biometryType === 'Biometrics');
  } catch (err) {
    logError('isBiometricsAvailable', err);
    return false;
  }
}

export async function getBiometricType(): Promise<string | null> {
  try {
    const { available, biometryType } = await biometrics.isSensorAvailable();
    if (!available) return null;
    return biometryType ?? null;
  } catch {
    return null;
  }
}

export async function authenticateBiometric(reason: string = '验证身份以解锁相册'): Promise<boolean> {
  try {
    const { success } = await biometrics.simplePrompt({
      promptMessage: reason,
      cancelButtonText: '使用 PIN',
    });
    return success;
  } catch (err) {
    logError('authenticateBiometric', err);
    return false;
  }
}

export async function createBiometricKey(): Promise<string | null> {
  try {
    const { publicKey } = await biometrics.createKeys();
    return publicKey;
  } catch (err) {
    logError('createBiometricKey', err);
    return null;
  }
}

export async function deleteBiometricKey(): Promise<boolean> {
  try {
    await biometrics.deleteKeys();
    return true;
  } catch {
    return false;
  }
}
