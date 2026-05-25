declare module 'react-native-push-notification' {
  interface Notification {
    channelId?: string;
    title?: string;
    message?: string;
    date?: Date;
    allowWhileIdle?: boolean;
    repeatTime?: number;
  }

  export function configure(options: {
    onNotification?: (notification: any) => void;
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }): void;

  export function createChannel(
    channel: {
      channelId: string;
      channelName: string;
      importance?: number;
      vibrate?: boolean;
    },
    callback: (created: boolean) => void,
  ): void;

  export function localNotificationSchedule(notification: Notification): void;

  export function cancelAllLocalNotifications(): void;

  export function requestPermissions(): Promise<any>;
}

declare class TextEncoder {
  encode(input?: string): Uint8Array;
}
