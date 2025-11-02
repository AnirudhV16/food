// frontend/components/RatingScreen.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const getStarColor = (rating) => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  return colors[rating - 1] || '#6b7280';
};

export default function RatingScreen({ theme, darkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('No user logged in');
      setLoading(false);
      return;
    }

    console.log('Loading products for ratings, user:', user.uid);

    // Query only user's products
    const q = query(
      collection(db, 'products'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Loaded', productList.length, 'products for rating');
        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Text
            key={i}
            style={[
              styles.star,
              { color: i < rating ? getStarColor(rating) : '#d1d5db' }
            ]}
          >
            ⭐
          </Text>
        ))}
      </View>
    );
  };

  const renderProductCard = (product) => {
    const rating = product.rating || 3;
    const goodContents = product.goodContents || [];
    const badContents = product.badContents || [];

    return (
      <View
        key={product.id}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
            {product.name}
          </Text>
          {renderStars(rating)}
        </View>

        {/* Good Contents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.goodIcon}>✓</Text>
            <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
              Good Contents
            </Text>
          </View>
          {goodContents.length > 0 ? (
            goodContents.map((content, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.listText, { color: theme.textMuted }]}>
                  {content}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No specific good contents identified
            </Text>
          )}
        </View>

        {/* Bad Contents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.badIcon}>✗</Text>
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
              Bad Contents
            </Text>
          </View>
          {badContents.length > 0 ? (
            badContents.map((content, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.listText, { color: theme.textMuted }]}>
                  {content}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No concerning ingredients identified
            </Text>
          )}
        </View>

        {/* Health Summary */}
        {product.healthSummary && (
          <View style={[styles.summaryBox, { backgroundColor: darkMode ? '#374151' : '#F3F4F6' }]}>
            <Text style={[styles.summaryText, { color: theme.text }]}>
              💡 {product.healthSummary}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Product Health Ratings
        </Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Loading ratings...
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyMainText, { color: theme.textMuted }]}>
              No products to rate yet
            </Text>
            <Text style={[styles.emptySubText, { color: theme.textMuted }]}>
              Add products in the Items tab to see their health ratings
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map(product => renderProductCard(product))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  productName: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    marginLeft: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goodIcon: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  badIcon: {
    fontSize: 18,
    color: '#ef4444',
    marginRight: 8,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    color: '#9CA3AF',
  },
  listText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  summaryBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyMainText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});