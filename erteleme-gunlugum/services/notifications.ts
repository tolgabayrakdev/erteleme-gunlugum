import * as Notifications from 'expo-notifications';
import { storageService } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Schedule weekly motivational notification
  async scheduleWeeklyCheck(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Schedule for every Monday at 9 AM
    // Note: Calendar triggers may vary by platform, using a weekly interval as fallback
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(9, 0, 0, 0);
    
    const secondsUntilMonday = Math.max(0, Math.floor((nextMonday.getTime() - now.getTime()) / 1000));
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Haftalık Değerlendirme',
        body: 'Bu haftaki erteleme kayıtlarınızı kontrol etmek ister misiniz?',
        data: { type: 'weekly_check' },
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntilMonday > 0 ? secondsUntilMonday : 60 * 60 * 24 * 7, // Weekly interval
        repeats: true,
      } as Notifications.TimeIntervalTriggerInput,
    });
  },

  // Send immediate motivational message based on postponement count
  async sendMotivationalMessage(postponementCount: number): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const messages = this.getMotivationalMessages(postponementCount);
    if (messages.length === 0) return;

    // Send notification with a random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMessage.title,
        body: randomMessage.body,
        data: { type: 'motivational' },
      },
      trigger: null, // Send immediately
    });
  },

  // Get motivational messages based on postponement count
  getMotivationalMessages(count: number): { title: string; body: string }[] {
    if (count === 0) {
      return [
        {
          title: '🎉 Harika!',
          body: 'Bu hafta hiç erteleme yapmadınız. Devam edin!',
        },
      ];
    }

    if (count <= 2) {
      return [
        {
          title: '💪 İyi Gidiyorsunuz!',
          body: `Bu hafta sadece ${count} görev ertelediniz. Küçük adımlarla ilerlemeye devam edin!`,
        },
        {
          title: '🌟 Güzel!',
          body: `${count} erteleme çok az. Her gün biraz daha ilerleyebilirsiniz!`,
        },
      ];
    }

    if (count <= 5) {
      return [
        {
          title: '📊 Farkındalık',
          body: `Bu hafta ${count} görev ertelediniz. Belki bazı görevleri daha küçük parçalara bölebilirsiniz?`,
        },
        {
          title: '💡 Öneri',
          body: `${count} erteleme yaptınız. En zor görevi 5 dakika yapmayı deneyin - başlamak yarısıdır!`,
        },
      ];
    }

    return [
      {
        title: '🤔 Düşünelim',
        body: `Bu hafta ${count} görev ertelediniz. Nedenlerini gözden geçirmek ister misiniz?`,
      },
      {
        title: '📝 Not',
        body: `${count} erteleme kaydettiniz. İstatistiklerinize bakarak pattern'leri görebilirsiniz.`,
      },
    ];
  },

  // Check and send weekly summary
  async checkAndSendWeeklySummary(): Promise<void> {
    const postponements = await storageService.getPostponements();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekPostponements = postponements.filter((p) => {
      const pDate = new Date(p.date);
      return pDate >= weekAgo;
    });

    if (thisWeekPostponements.length > 0) {
      await this.sendMotivationalMessage(thisWeekPostponements.length);
    }
  },

  // Cancel all notifications
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};

