import React, { useState } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BarChart } from 'react-native-chart-kit';
import { Statistics, TaskCategory } from '@/types';
import { storageService } from '@/services/storage';
import { motivationService, MotivationCard } from '@/services/motivation';
import { format, endOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;
// Card margin (20*2) + card padding (20*2) = 80
const chartWidth = screenWidth - 80;

const categoryColors: Record<TaskCategory, string> = {
  iş: '#4A90E2',
  kişisel: '#50C878',
  okul: '#FF6B6B',
  sağlık: '#FFA500',
  diğer: '#9B59B6',
};

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [motivationCards, setMotivationCards] = useState<MotivationCard[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadStatistics();
      loadMotivationCards();
    }, [])
  );

  const loadMotivationCards = async () => {
    const cards = await motivationService.getMotivationCards();
    setMotivationCards(cards);
  };

  const loadStatistics = async () => {
    const tasks = await storageService.getTasks();
    const postponements = await storageService.getPostponements();

    // Calculate statistics
    const categoryBreakdown: Record<TaskCategory, number> = {
      iş: 0,
      kişisel: 0,
      okul: 0,
      sağlık: 0,
      diğer: 0,
    };

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};

    postponements.forEach((postponement) => {
      const task = tasks.find((t) => t.id === postponement.taskId);
      if (task) {
        categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + 1;
      }

      const date = new Date(postponement.date);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      const dayName = format(date, 'EEEE', { locale: tr });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

      reasonCounts[postponement.reason] = (reasonCounts[postponement.reason] || 0) + 1;
    });

    // Calculate top reasons
    const totalReasons = Object.values(reasonCounts).reduce((a, b) => a + b, 0);
    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalReasons > 0 ? Math.round((count / totalReasons) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate time patterns
    const timePatterns = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0,
    }));

    const dayPatterns = Object.entries(dayCounts).map(([day, count]) => ({
      day,
      count,
    }));

    // Find least postponed week
    const now = new Date();
    const weeks = eachWeekOfInterval(
      {
        start: subWeeks(now, 12),
        end: now,
      },
      { weekStartsOn: 1 }
    );

    const weekCounts = weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = postponements.filter((p) => {
        const pDate = new Date(p.date);
        return pDate >= weekStart && pDate <= weekEnd;
      }).length;
      return { week: format(weekStart, 'dd MMM', { locale: tr }), count };
    });

    const leastPostponedWeek = weekCounts.reduce(
      (min, week) => (week.count < min.count ? week : min),
      weekCounts[0] || { week: '', count: Infinity }
    );

    const stats: Statistics = {
      totalPostponements: postponements.length,
      categoryBreakdown,
      timePatterns,
      dayPatterns,
      topReasons,
      leastPostponedWeek: leastPostponedWeek.count < Infinity ? leastPostponedWeek : undefined,
    };

    setStatistics(stats);
  };

  if (!statistics) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  const categoryData = {
    labels: Object.keys(statistics.categoryBreakdown),
    datasets: [
      {
        data: Object.values(statistics.categoryBreakdown),
      },
    ],
  };

  // Group hours into 3 time periods (8 hours each)
  // 00:00-07:59 (Gece/Sabah), 08:00-15:59 (Gündüz), 16:00-23:59 (Akşam/Gece)
  const timePeriods = [
    { label: '00:00-07:59', start: 0, end: 7, name: 'Gece/Sabah' },
    { label: '08:00-15:59', start: 8, end: 15, name: 'Gündüz' },
    { label: '16:00-23:59', start: 16, end: 23, name: 'Akşam/Gece' },
  ];

  const periodCounts = timePeriods.map((period) => {
    const count = statistics.timePatterns
      .filter((p) => p.hour >= period.start && p.hour <= period.end)
      .reduce((sum, p) => sum + p.count, 0);
    return { ...period, count };
  });

  const hourLabels = timePeriods.map((p) => p.label);
  const hourData = {
    labels: hourLabels,
    datasets: [
      {
        data: periodCounts.map((p) => p.count),
      },
    ],
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">İstatistikler</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView}>
        {/* Motivation Cards */}
        {motivationCards.length > 0 && (
          <ThemedView style={styles.motivationSection}>
            {motivationCards.map((card, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.motivationCard,
                  card.type === 'success' && styles.motivationCardSuccess,
                  card.type === 'encouragement' && styles.motivationCardEncouragement,
                  card.type === 'info' && styles.motivationCardInfo,
                  card.type === 'warning' && styles.motivationCardWarning,
                ]}>
                <ThemedText type="subtitle" style={styles.motivationCardTitle}>
                  {card.title}
                </ThemedText>
                <ThemedText style={styles.motivationCardMessage}>{card.message}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Total Postponements */}
        <ThemedView style={styles.totalCard}>
          <ThemedText type="subtitle" style={styles.totalCardTitle}>
            Toplam Erteleme
          </ThemedText>
          <ThemedText style={styles.bigNumber}>{statistics.totalPostponements}</ThemedText>
        </ThemedView>

        {/* Category Breakdown */}
        {statistics.totalPostponements > 0 && (
          <>
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Kategoriye Göre Erteleme
              </ThemedText>
              <ThemedView style={styles.chartContainer}>
                <BarChart
                  data={categoryData}
                  width={chartWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={styles.chart}
                />
              </ThemedView>
              <ThemedView style={styles.categoryList}>
                {Object.entries(statistics.categoryBreakdown).map(([category, count]) => (
                  <ThemedView key={category} style={styles.categoryItem}>
                    <ThemedView
                      style={[
                        styles.categoryDot,
                        { backgroundColor: categoryColors[category as TaskCategory] },
                      ]}
                    />
                    <ThemedText style={styles.categoryLabel}>
                      {category}: {count}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>

            {/* Time Patterns */}
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Saate Göre Erteleme Dağılımı
              </ThemedText>
              <ThemedView style={styles.chartContainer}>
                <BarChart
                  data={hourData}
                  width={chartWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              </ThemedView>
            </ThemedView>

            {/* Top Reasons */}
            {statistics.topReasons.length > 0 && (
              <ThemedView style={styles.card}>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  En Çok Erteleme Nedenleri
                </ThemedText>
                {statistics.topReasons.map((item, index) => (
                  <ThemedView key={index} style={styles.reasonItem}>
                    <ThemedText style={styles.reasonText}>
                      {index + 1}. {item.reason}
                    </ThemedText>
                    <ThemedText style={styles.reasonCount}>
                      {item.count} kez (%{item.percentage})
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}

            {/* Motivation Card */}
            {statistics.leastPostponedWeek && (
              <ThemedView style={[styles.card, styles.motivationCardSuccess]}>
                <ThemedText type="subtitle" style={styles.motivationTitle}>
                  🎉 Tebrikler!
                </ThemedText>
                <ThemedText style={styles.motivationText}>
                  {statistics.leastPostponedWeek.week} haftasında sadece{' '}
                  {statistics.leastPostponedWeek.count} erteleme yaptınız. Bu haftanızı tekrar
                  edebilirsiniz!
                </ThemedText>
              </ThemedView>
            )}
          </>
        )}

        {statistics.totalPostponements === 0 && (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Henüz erteleme kaydı yok. İstatistikler burada görünecek.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginBottom: 0,
  },
  cardTitle: {
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 30,
    margin: 20,
    marginBottom: 0,
    alignItems: 'center',
  },
  totalCardTitle: {
    marginBottom: 20,
    fontSize: 16,
    opacity: 0.7,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#0a7ea4',
    textAlign: 'center',
    lineHeight: 84,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8
  },
  chart: {
    borderRadius: 16,
  },
  chartScrollView: {
    marginVertical: 8,
    paddingRight: 20,
  },
  categoryList: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryLabel: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    padding: 4
    
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
  },
  reasonCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  motivationTitle: {
    color: '#2E7D32',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2E7D32',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  motivationSection: {
    padding: 20,
    paddingBottom: 0,
    gap: 12,
  },
  motivationCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  motivationCardSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#50C878',
  },
  motivationCardEncouragement: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  motivationCardInfo: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFA500',
  },
  motivationCardWarning: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF6B6B',
  },
  motivationCardTitle: {
    marginBottom: 8,
    fontSize: 18,
  },
  motivationCardMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});

