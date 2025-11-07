import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Task, Postponement } from '@/types';
import { storageService } from '@/services/storage';
import { notificationService } from '@/services/notifications';

const postponeReasons = [
  'Yorgunum',
  'Motivasyonum yok',
  'Dikkat dağıldı',
  'Zamanım yok',
  'Zor görünüyor',
  'Başka bir şey yapmak istiyorum',
  'Diğer',
];

export default function PostponeModalScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    const tasks = await storageService.getTasks();
    const foundTask = tasks.find((t) => t.id === taskId);
    setTask(foundTask || null);
  }, [taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleSave = async () => {
    if (!task) return;

    const reason = selectedReason === 'Diğer' ? customReason : selectedReason;
    if (!reason.trim()) {
      Alert.alert('Hata', 'Lütfen erteleme nedenini seçin veya yazın');
      return;
    }

    // Get existing postponements for this task
    const existingPostponements = await storageService.getPostponementsByTaskId(task.id);
    const postponementNumber = existingPostponements.length + 1;

    // Create postponement record
    const postponement: Postponement = {
      id: Date.now().toString(),
      taskId: task.id,
      date: new Date().toISOString(),
      reason: reason.trim(),
      postponementNumber,
    };

    await storageService.savePostponement(postponement);

    // Update task status
    const updatedTask: Task = {
      ...task,
      status: 'postponed',
      updatedAt: new Date().toISOString(),
    };
    await storageService.saveTask(updatedTask);

    // Send motivational notification if needed
    const allPostponements = await storageService.getPostponements();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekCount = allPostponements.filter((p) => {
      const pDate = new Date(p.date);
      return pDate >= weekAgo;
    }).length;

    // Send notification if this is the 3rd, 5th, or 10th postponement this week
    if ([3, 5, 10].includes(thisWeekCount)) {
      await notificationService.sendMotivationalMessage(thisWeekCount);
    }

    Alert.alert(
      'Kaydedildi',
      `Bu görev ${postponementNumber}. kez ertelendi.`,
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  if (!task) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Görev bulunamadı</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.cancelButton}>İptal</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <ThemedText style={styles.saveButton}>Kaydet</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.taskInfo}>
          <ThemedText type="subtitle" style={styles.taskTitle}>
            {task.title}
          </ThemedText>
          <ThemedText style={styles.taskCategory}>{task.category}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            Neden erteliyorsun? *
          </ThemedText>
          <ThemedView style={styles.reasonContainer}>
            {postponeReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.reasonButtonActive,
                ]}
                onPress={() => {
                  setSelectedReason(reason === selectedReason ? '' : reason);
                  if (reason !== 'Diğer') {
                    setCustomReason('');
                  }
                }}>
                <ThemedText
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextActive,
                  ]}>
                  {reason}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
          {selectedReason === 'Diğer' && (
            <TextInput
              style={styles.input}
              placeholder="Kendi nedeninizi yazın"
              placeholderTextColor="#9BA1A6"
              value={customReason}
              onChangeText={setCustomReason}
              multiline
            />
          )}
        </ThemedView>

        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Bu erteleme kaydınızda saklanacak ve istatistiklerinizde görünecektir.
          </ThemedText>
        </ThemedView>
      </ScrollView>
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
    paddingTop: 10,
  },
  cancelButton: {
    fontSize: 16,
    color: '#0a7ea4',
  },
  saveButton: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  taskInfo: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 24,
  },
  taskTitle: {
    marginBottom: 8,
  },
  taskCategory: {
    fontSize: 14,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
  },
  reasonContainer: {
    gap: 8,
  },
  reasonButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F5F5F5',
  },
  reasonButtonActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  reasonText: {
    fontSize: 14,
  },
  reasonTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#F5F5F5',
    marginTop: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
});

