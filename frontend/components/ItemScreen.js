// frontend/components/ItemScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import ItemCard from './ItemCard';
import AddProductModal from './AddProductModal';

export default function ItemScreen({ theme, darkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const { user } = useAuth();

  // Load products from Firestore (only user's products)
  useEffect(() => {
    if (!user) return;

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
        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading products:', error);
        Alert.alert('Error', 'Failed to load products. Check Firestore permissions.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Save product (add or update)
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          userId: user.uid, // Ensure userId is always set
        });
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), {
          ...productData,
          userId: user.uid, // Add userId for security rules
        });
        Alert.alert('Success', 'Product added successfully!');
      }
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product: ' + error.message);
      throw error;
    }
  };

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

  // Open modal for adding new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };

  // Open modal for editing product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
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
                onEdit={() => handleEditProduct(product)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddProductModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editProduct={editingProduct}
        theme={theme}
      />
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