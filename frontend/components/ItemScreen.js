// frontend/components/ItemScreen.js (FIXED VERSION)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import ItemCard from './ItemCard';

export default function ItemScreen({ theme, darkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Delete product
  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', productId));
              Alert.alert('Success', 'Product deleted successfully!');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  // For now, just show an alert for add/edit
  const handleAddProduct = () => {
    Alert.alert('Coming Soon', 'Add Product Modal will open here');
  };

  const handleEdit = (product) => {
    Alert.alert('Coming Soon', `Edit ${product.name} - Modal will open here`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>AI Food Tracker</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Loading products...
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No products yet. Add your first product!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((product) => (
              <ItemCard
                key={product.id}
                product={product}
                theme={theme}
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}
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
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});