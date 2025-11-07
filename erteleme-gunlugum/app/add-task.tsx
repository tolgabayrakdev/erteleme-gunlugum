import { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Task, TaskCategory } from '@/types';
import { storageService } from '@/services/storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const categories: TaskCategory[] = ['iş', 'kişisel', 'okul', 'sağlık', 'diğer'];

const postponeReasons = [
  'Yorgunum',
  'Motivasyonum yok',
  'Dikkat dağıldı',
  'Zamanım yok',
  'Zor görünüyor',
  'Başka bir şey yapmak istiyorum',
  'Diğer',
];

export default function AddTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('diğer');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen görev başlığı girin');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      deadline: deadline?.toISOString(),
      initialPostponeReason: postponeReason || customReason || undefined,
      status: postponeReason || customReason ? 'postponed' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveTask(newTask);
    router.back();
  };

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
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            Başlık *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Örn: Raporu yazmak"
            placeholderTextColor="#9BA1A6"
            value={title}
            onChangeText={setTitle}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            Kategori
          </ThemedText>
          <ThemedView style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}>
                <ThemedText
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            Son Tarih (Opsiyonel)
          </ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}>
            <ThemedText style={styles.dateButtonText}>
              {deadline
                ? deadline.toLocaleDateString('tr-TR')
                : 'Tarih seçin'}
            </ThemedText>
          </TouchableOpacity>
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              locale="tr_TR"
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDeadline(selectedDate);
                }
              }}
            />
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            Neden Erteliyorsun? (Opsiyonel)
          </ThemedText>
          <ThemedView style={styles.reasonContainer}>
            {postponeReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  postponeReason === reason && styles.reasonButtonActive,
                ]}
                onPress={() => {
                  setPostponeReason(reason === postponeReason ? '' : reason);
                  if (reason !== 'Diğer') {
                    setCustomReason('');
                  }
                }}>
                <ThemedText
                  style={[
                    styles.reasonText,
                    postponeReason === reason && styles.reasonTextActive,
                  ]}>
                  {reason}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
          {postponeReason === 'Diğer' && (
            <TextInput
              style={styles.input}
              placeholder="Kendi nedeninizi yazın"
              placeholderTextColor="#9BA1A6"
              value={customReason}
              onChangeText={setCustomReason}
            />
          )}
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
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#F5F5F5',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F5F5F5',
  },
  categoryButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  categoryText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  dateButtonText: {
    fontSize: 16,
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
});

