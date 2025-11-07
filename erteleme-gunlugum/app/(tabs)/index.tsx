import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Task } from '@/types';
import { storageService } from '@/services/storage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const categoryColors: Record<string, string> = {
  iş: '#4A90E2',
  kişisel: '#50C878',
  okul: '#FF6B6B',
  sağlık: '#FFA500',
  diğer: '#9B59B6',
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    const loadedTasks = await storageService.getTasks();
    setTasks(loadedTasks);
  };

  const handlePostpone = (task: Task) => {
    router.push({
      pathname: '/postpone-modal',
      params: { taskId: task.id },
    });
  };

  const handleDone = async (task: Task) => {
    const updatedTask: Task = {
      ...task,
      status: 'done',
      updatedAt: new Date().toISOString(),
    };
    await storageService.saveTask(updatedTask);
    loadTasks();
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteTask(task.id);
          loadTasks();
        },
      },
    ]);
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'postponed');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Görevlerim</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-task')}>
          <IconSymbol name="plus.circle.fill" size={28} color="#0a7ea4" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.scrollView}>
        {pendingTasks.length === 0 && doneTasks.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="checklist" size={64} color="#687076" />
            <ThemedText style={styles.emptyText}>Henüz görev eklenmemiş</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Yeni görev eklemek için + butonuna tıklayın
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Yapılacaklar ({pendingTasks.length})
                </ThemedText>
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPostpone={() => handlePostpone(task)}
                    onDone={() => handleDone(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </ThemedView>
            )}

            {doneTasks.length > 0 && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Tamamlananlar ({doneTasks.length})
                </ThemedText>
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPostpone={() => handlePostpone(task)}
                    onDone={() => handleDone(task)}
                    onDelete={() => handleDelete(task)}
                  />
                ))}
              </ThemedView>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

interface TaskCardProps {
  task: Task;
  onPostpone: () => void;
  onDone: () => void;
  onDelete: () => void;
}

function TaskCard({ task, onPostpone, onDone, onDelete }: TaskCardProps) {
  const categoryColor = categoryColors[task.category] || categoryColors.diğer;
  const isDone = task.status === 'done';

  return (
    <ThemedView style={[styles.taskCard, isDone && styles.taskCardDone]}>
      <ThemedView style={styles.taskHeader}>
        <ThemedView style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <ThemedText style={styles.categoryText}>{task.category}</ThemedText>
        </ThemedView>
        {task.deadline && (
          <ThemedText style={styles.deadline}>
            {format(new Date(task.deadline), 'dd MMM yyyy', { locale: tr })}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedText style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
        {task.title}
      </ThemedText>

      {task.initialPostponeReason && (
        <ThemedText style={styles.postponeReason}>
          İlk erteleme nedeni: {task.initialPostponeReason}
        </ThemedText>
      )}

      <ThemedView style={styles.taskActions}>
        {!isDone && (
          <>
            <TouchableOpacity style={styles.postponeButton} onPress={onPostpone}>
              <IconSymbol name="clock.fill" size={18} color="#FF6B6B" />
              <ThemedText style={styles.postponeButtonText}>Ertele</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={onDone}>
              <IconSymbol name="checkmark.circle.fill" size={18} color="#50C878" />
              <ThemedText style={styles.doneButtonText}>Yapıldı</ThemedText>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  taskCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postponementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  postponementCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deadline: {
    fontSize: 12,
    opacity: 0.7,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  postponeReason: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  postponeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  postponeButtonText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0FFF4',
  },
  doneButtonText: {
    color: '#50C878',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
});
