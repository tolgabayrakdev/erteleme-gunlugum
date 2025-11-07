import { storageService } from './storage';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export interface MotivationCard {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'encouragement';
  icon: string;
}

export const motivationService = {
  // Get weekly postponement count
  async getWeeklyPostponementCount(): Promise<number> {
    const postponements = await storageService.getPostponements();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return postponements.filter((p) => {
      const pDate = new Date(p.date);
      return isWithinInterval(pDate, { start: weekStart, end: weekEnd });
    }).length;
  },

  // Get motivation cards
  async getMotivationCards(): Promise<MotivationCard[]> {
    const tasks = await storageService.getTasks();
    const postponements = await storageService.getPostponements();
    const cards: MotivationCard[] = [];

    // Weekly postponement count
    const weeklyCount = await this.getWeeklyPostponementCount();
    if (weeklyCount === 0) {
      cards.push({
        title: '🎉 Mükemmel Hafta!',
        message: 'Bu hafta hiç erteleme yapmadınız. Harika bir başlangıç!',
        type: 'success',
        icon: '🎉',
      });
    } else if (weeklyCount <= 2) {
      cards.push({
        title: '💪 İyi Gidiyorsunuz!',
        message: `Bu hafta sadece ${weeklyCount} erteleme yaptınız. Küçük adımlarla ilerliyorsunuz!`,
        type: 'encouragement',
        icon: '💪',
      });
    } else if (weeklyCount <= 5) {
      cards.push({
        title: '📊 Farkındalık',
        message: `Bu hafta ${weeklyCount} erteleme yaptınız. Görevleri daha küçük parçalara bölmeyi deneyin.`,
        type: 'info',
        icon: '📊',
      });
    }

    // Completed tasks this week
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const completedThisWeek = tasks.filter((t) => {
      if (t.status !== 'done') return false;
      const doneDate = new Date(t.updatedAt);
      return isWithinInterval(doneDate, { start: weekStart, end: now });
    }).length;

    if (completedThisWeek > 0) {
      cards.push({
        title: '✅ Tamamlanan Görevler',
        message: `Bu hafta ${completedThisWeek} görevi tamamladınız. Tebrikler!`,
        type: 'success',
        icon: '✅',
      });
    }

    // Total postponements
    const totalPostponements = postponements.length;
    if (totalPostponements > 0) {
      const avgPerWeek = totalPostponements / Math.max(1, Math.ceil((now.getTime() - new Date(tasks[0]?.createdAt || now).getTime()) / (7 * 24 * 60 * 60 * 1000)));
      
      if (weeklyCount < avgPerWeek) {
        cards.push({
          title: '📈 İlerleme Var!',
          message: `Bu hafta ortalamanın altında erteleme yaptınız. İyi gidiyorsunuz!`,
          type: 'encouragement',
          icon: '📈',
        });
      }
    }

    // Longest streak without postponement
    if (postponements.length > 0) {
      const sortedPostponements = [...postponements].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const lastPostponement = new Date(sortedPostponements[sortedPostponements.length - 1].date);
      const daysSinceLastPostponement = Math.floor((now.getTime() - lastPostponement.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastPostponement >= 3) {
        cards.push({
          title: '🔥 Seri Devam Ediyor!',
          message: `${daysSinceLastPostponement} gündür erteleme yapmıyorsunuz. Harika!`,
          type: 'success',
          icon: '🔥',
        });
      }
    }

    return cards;
  },

  // Get motivational message for statistics
  getMotivationalMessage(totalPostponements: number, weeklyCount: number): string {
    if (totalPostponements === 0) {
      return 'Henüz erteleme kaydı yok. Görevlerinizi takip etmeye başlayın!';
    }

    if (weeklyCount === 0) {
      return 'Bu hafta hiç erteleme yapmadınız. Mükemmel! 🎉';
    }

    if (weeklyCount <= 2) {
      return `Bu hafta sadece ${weeklyCount} erteleme yaptınız. İyi gidiyorsunuz! 💪`;
    }

    if (weeklyCount <= 5) {
      return `Bu hafta ${weeklyCount} erteleme yaptınız. Görevleri daha küçük parçalara bölmeyi deneyin. 📊`;
    }

    return `Bu hafta ${weeklyCount} erteleme yaptınız. İstatistiklerinize bakarak pattern'leri görebilirsiniz. 🤔`;
  },
};

