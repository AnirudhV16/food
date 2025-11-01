// frontend/App.js
import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import ItemScreen from './components/ItemScreen';
import RecipeScreen from './components/RecipeScreen';
import RatingScreen from './components/RatingScreen';
import LoginScreen from './components/LoginScreen';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [darkMode, setDarkMode] = useState(false);
  
  const { user, loading } = useAuth();

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

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen theme={theme} />;
  }

  // Show main app if authenticated
  return (
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
        user={user}
      />

      {/* Main Content */}
      <View style={[styles.content, sidebarOpen && styles.contentShifted]}>
        {activeTab === 'items' && <ItemScreen theme={theme} darkMode={darkMode} />}
        {activeTab === 'recipe' && <RecipeScreen theme={theme} darkMode={darkMode} />}
        {activeTab === 'rating' && <RatingScreen theme={theme} darkMode={darkMode} />}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <AppContent />
      </AuthProvider>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});