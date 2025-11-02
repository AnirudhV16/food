// frontend/components/ItemCard.js - FIXED VERSION
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// Helper functions
const getStarColor = (rating) => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  return colors[rating - 1] || '#6b7280';
};

const calculateDaysUntilExpiry = (expDate) => {
  const today = new Date();
  const expiry = new Date(expDate);
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function ItemCard({ product, theme, onEdit, onDelete }) {
  const daysLeft = calculateDaysUntilExpiry(product.expDate);
  const rating = product.rating || 3;

  const handleEdit = () => {
    console.log('✏️ Edit button clicked for:', product.name);
    if (onEdit) {
      onEdit();
    } else {
      console.error('❌ onEdit function not provided');
    }
  };

  const handleDelete = () => {
    console.log('🗑️ Delete button clicked for:', product.name);
    if (onDelete) {
      Alert.alert(
        'Delete Product',
        `Are you sure you want to delete "${product.name}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('✓ User confirmed delete');
              onDelete();
            }
          }
        ]
      );
    } else {
      console.error('❌ onDelete function not provided');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.rating}>
          {[...Array(5)].map((_, i) => (
            <Text
              key={i}
              style={[styles.star, { color: i < rating ? getStarColor(rating) : '#d1d5db' }]}
            >
              ⭐
            </Text>
          ))}
        </View>
      </View>

      <Text
        style={[
          styles.expiryText,
          { color: daysLeft < 5 ? '#ef4444' : daysLeft < 10 ? '#f97316' : theme.textMuted }
        ]}
      >
        {daysLeft > 0 ? `${daysLeft} days until expiry` : daysLeft === 0 ? 'Expires today!' : 'Expired'}
      </Text>

      {/* Manufacturing and Expiry Dates */}
      <View style={styles.dateInfo}>
        <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
          Mfg: {new Date(product.mfgDate).toLocaleDateString()}
        </Text>
        <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
          Exp: {new Date(product.expDate).toLocaleDateString()}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 350,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
  },
  expiryText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});