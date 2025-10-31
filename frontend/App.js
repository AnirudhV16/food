// frontend/App.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Sidebar from './components/Sidebar';
import ItemScreen from './components/ItemScreen';
import RecipeScreen from './components/RecipeScreen';
import RatingScreen from './components/RatingScreen';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [darkMode, setDarkMode] = useState(false);

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Theme colors
  const theme = {
    bg: darkMode ? '#111827' : '#F9FAFB',
    card: darkMode ? '#1F2937' : '#FFFFFF',
    text: darkMode ? '#FFFFFF' : '#111827',
    textMuted: darkMode ? '#9CA3AF' : '#6B7280',
    border: darkMode ? '#374151' : '#E5E7EB',
    primary: '#3B82F6',
    sidebar: darkMode ? '#1F2937' : '#FFFFFF',
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          darkMode={darkMode}
          onThemeToggle={() => setDarkMode(!darkMode)}
          theme={theme}
        />

        {/* Main Content */}
        <View style={[styles.content, sidebarOpen && styles.contentShifted]}>
          {activeTab === 'items' && <ItemScreen theme={theme} darkMode={darkMode} />}
          {activeTab === 'recipe' && <RecipeScreen theme={theme} darkMode={darkMode} />}
          {activeTab === 'rating' && <RatingScreen theme={theme} darkMode={darkMode} />}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
  },
  contentShifted: {
    marginLeft: 280,
  },
});