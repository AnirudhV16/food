// frontend/components/Sidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export default function Sidebar({ isOpen, onToggle, activeTab, onTabChange, darkMode, onThemeToggle, theme }) {
  const slideAnim = React.useRef(new Animated.Value(isOpen ? 0 : -280)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -280,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: theme.card }]}
        onPress={onToggle}
      >
        <View style={styles.toggleIcon}>
          {isOpen ? (
            <>
              <View style={[styles.bar, styles.barActive]} />
              <View style={[styles.bar, styles.barActive]} />
              <View style={[styles.bar, styles.barActive]} />
            </>
          ) : (
            <>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { backgroundColor: theme.sidebar, transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Profile Section */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>John Doe</Text>
        </View>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: darkMode ? '#374151' : '#F3F4F6' }]}
          onPress={onThemeToggle}
        >
          <Text style={[styles.themeText, { color: theme.text }]}>Theme</Text>
          <Text style={styles.themeIcon}>{darkMode ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>

        {/* Navigation Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'items' && styles.tabActive,
              { backgroundColor: activeTab === 'items' ? theme.primary : (darkMode ? '#374151' : '#F3F4F6') }
            ]}
            onPress={() => onTabChange('items')}
          >
            <Text style={styles.tabEmoji}>🧺</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'items' ? '#FFFFFF' : theme.text }
            ]}>
              Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'recipe' && styles.tabActive,
              { backgroundColor: activeTab === 'recipe' ? theme.primary : (darkMode ? '#374151' : '#F3F4F6') }
            ]}
            onPress={() => onTabChange('recipe')}
          >
            <Text style={styles.tabEmoji}>🍳</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'recipe' ? '#FFFFFF' : theme.text }
            ]}>
              Recipe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'rating' && styles.tabActive,
              { backgroundColor: activeTab === 'rating' ? theme.primary : (darkMode ? '#374151' : '#F3F4F6') }
            ]}
            onPress={() => onTabChange('rating')}
          >
            <Text style={styles.tabEmoji}>⭐</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'rating' ? '#FFFFFF' : theme.text }
            ]}>
              Rating
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 18,
    height: 80,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleIcon: {
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 4,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  barActive: {
    height: 16,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    padding: 24,
    zIndex: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profile: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  themeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeIcon: {
    fontSize: 20,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  tabActive: {
    // Active tab styling applied via backgroundColor in component
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
});