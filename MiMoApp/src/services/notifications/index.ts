import PushNotification from 'react-native-push-notification';
import { generateMemories, type MemoryGroup } from '../memories';
import type { Photo } from '../../types';

const CHANNEL_ID = 'mimo-memories';
const CHANNEL_NAME = '回忆通知';

export function setupNotifications(): void {
  PushNotification.configure({
    onNotification: () => {},
    popInitialNotification: true,
    requestPermissions: false,
  });

  PushNotification.createChannel(
    { channelId: CHANNEL_ID, channelName: CHANNEL_NAME, importance: 3, vibrate: true },
    () => {},
  );
}

export function scheduleMemoryNotification(photos: Photo[]): void {
  PushNotification.cancelAllLocalNotifications();

  const memories = generateMemories(photos);
  if (memories.length === 0) return;

  const topMemory = memories[0];

  PushNotification.localNotificationSchedule({
    channelId: CHANNEL_ID,
    title: topMemory.title,
    message: topMemory.subtitle,
    date: new Date(Date.now() + 8 * 60 * 60 * 1000),
    allowWhileIdle: true,
    repeatTime: 1,
  });
}

export function cancelMemoryNotifications(): void {
  PushNotification.cancelAllLocalNotifications();
}

export function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    PushNotification.requestPermissions().then((result) => {
      resolve(!!result);
    }).catch(() => resolve(false));
  });
}
