import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineIcon } from '../components/shared/LineIcon';

const PLANTS = [
  { id: '1', name: 'Lemon Tree', date: 'Today', image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=200' },
  { id: '2', name: 'Swiss Cheese Plant', date: 'Today', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=200' },
  { id: '3', name: 'Snake Plant', date: 'Yesterday', image: 'https://images.unsplash.com/photo-1641984157960-e275239be2d1?q=80&w=200' },
];

const TASKS = [
  { id: '1', plant: 'Henbit Deadnettle', task: 'Your fertilizing schedule', status: 'Pending', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=100' },
  { id: '2', plant: 'Amaryllis', task: 'Your fertilizing schedule', status: 'Pending', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=100' },
];

export function DesignStyleDemoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PlantCare</Text>
          <Text style={styles.subtitle}>Create your forest</Text>
        </View>
        <Pressable style={styles.notificationButton}>
          <LineIcon name="info" size={24} color="#2D5016" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherIcon}>
            <LineIcon name="bar-chart" size={40} color="#2D5016" />
          </View>
          <View style={styles.weatherContent}>
            <Text style={styles.weatherTitle}>Cloudy 27°C</Text>
            <Text style={styles.weatherDesc}>Good for growth, rotate the pot regularly</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statCard}>
            <Text style={styles.statTitle}>Garden Health</Text>
            <Text style={styles.statValue}>88</Text>
            <LineIcon name="chevron-right" size={20} color="#2D5016" style={{ position: 'absolute', right: 16, top: 20 }} />
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>To-do</Text>
            <View style={styles.taskItem}>
              <LineIcon name="sparkle" size={24} color="#D46F4D" />
              <Text style={styles.taskText}>Fertilize</Text>
            </View>
            <View style={styles.taskItem}>
              <LineIcon name="list" size={24} color="#4F7942" />
              <Text style={styles.taskText}>Watering</Text>
            </View>
          </View>
        </View>

        {/* Plants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Plants</Text>
            <Pressable>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plantsScroll}>
            {PLANTS.map(plant => (
              <Pressable key={plant.id} style={styles.plantCard}>
                <Image source={{ uri: plant.image }} style={styles.plantImage} />
                <Text style={styles.plantName}>{plant.name}</Text>
                <View style={styles.plantDateRow}>
                  <LineIcon name="clock" size={14} color="#8B9A7E" />
                  <Text style={styles.plantDate}>{plant.date}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          {TASKS.map(task => (
            <Pressable key={task.id} style={styles.taskCard}>
              <Image source={{ uri: task.image }} style={styles.taskImage} />
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <LineIcon name="sparkle" size={18} color="#D46F4D" />
                  <Text style={styles.taskPlant}>{task.plant}</Text>
                </View>
                <Text style={styles.taskDesc}>{task.task}</Text>
              </View>
              <View style={styles.taskStatus}>
                <Text style={styles.statusText}>{task.status}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab}>
        <LineIcon name="camera" size={32} color="#FFFFFF" />
      </Pressable>

      {/* Custom Bottom Tab (Demo Style) */}
      <View style={[styles.bottomTab, { paddingBottom: insets.bottom + 12 }]}>
        {['home', 'discover', 'garden', 'profile'].map((item, index) => (
          <Pressable key={item} style={[styles.tabItem, index === 0 && styles.activeTab]}>
            <LineIcon name={index === 0 ? 'grid-filled' : index === 1 ? 'search' : index === 2 ? 'leaf' : 'user'} size={24} color={index === 0 ? '#2D5016' : '#8B9A7E'} />
            <Text style={[styles.tabLabel, index === 0 && styles.activeTabLabel]}>
              {['Home', 'Discover', 'Garden', 'Profile'][index]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F6EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5016',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B9A7E',
    fontWeight: '500',
    marginTop: 2,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  weatherCard: {
    flexDirection: 'row',
    backgroundColor: '#E2F0D9',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  weatherIcon: {
    marginRight: 16,
  },
  weatherContent: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 4,
  },
  weatherDesc: {
    fontSize: 14,
    color: '#4F7942',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E2F0D9',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2D5016',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D5016',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D5016',
  },
  seeAll: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F7942',
  },
  plantsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  plantCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  plantImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E2F0D9',
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  plantDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  plantDate: {
    fontSize: 13,
    color: '#8B9A7E',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E2F0D9',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taskPlant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  taskDesc: {
    fontSize: 14,
    color: '#8B9A7E',
  },
  taskStatus: {
    backgroundColor: '#E2F0D9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F7942',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D5016',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2D5016',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#E2F0D9',
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B9A7E',
  },
  activeTabLabel: {
    color: '#2D5016',
    fontWeight: '600',
  },
});
