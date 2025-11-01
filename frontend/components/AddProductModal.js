// frontend/components/AddProductModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeImages, rateProduct } from '../services/api';

export default function AddProductModal({ visible, onClose, onSave, editProduct, theme }) {
  const [productName, setProductName] = useState(editProduct?.name || '');
  const [mfgDate, setMfgDate] = useState(editProduct?.mfgDate || '');
  const [expDate, setExpDate] = useState(editProduct?.expDate || '');
  const [ingredients, setIngredients] = useState(
    editProduct?.ingredients?.join(', ') || ''
  );
  const [selectedImages, setSelectedImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(1); // 1: Input, 2: Analysis, 3: Review

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      if (editProduct) {
        setProductName(editProduct.name || '');
        setMfgDate(editProduct.mfgDate || '');
        setExpDate(editProduct.expDate || '');
        setIngredients(editProduct.ingredients?.join(', ') || '');
      } else {
        setProductName('');
        setMfgDate('');
        setExpDate('');
        setIngredients('');
      }
      setSelectedImages([]);
      setStep(1);
    }
  }, [visible, editProduct]);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        console.log('Selected images:', result.assets.length);
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera permissions');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        setSelectedImages([...selectedImages, result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleAnalyzeImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select or take photos first');
      return;
    }

    setAnalyzing(true);
    setStep(2);

    try {
      console.log('Starting image analysis...');
      console.log('Platform:', Platform.OS);
      console.log('Number of images:', selectedImages.length);

      let imageFiles;

      if (Platform.OS === 'web') {
        // Web: Convert blob URLs to actual File objects
        imageFiles = await Promise.all(
          selectedImages.map(async (asset, index) => {
            try {
              console.log(`Fetching image ${index + 1}:`, asset.uri);
              const response = await fetch(asset.uri);
              const blob = await response.blob();
              
              // Create a File object from the blob
              const file = new File([blob], `image_${index}.jpg`, { 
                type: blob.type || 'image/jpeg' 
              });
              
              console.log(`Image ${index + 1} converted:`, file.size, 'bytes');
              return file;
            } catch (error) {
              console.error(`Failed to convert image ${index + 1}:`, error);
              throw error;
            }
          })
        );
      } else {
        // Mobile: Use URI directly
        imageFiles = selectedImages.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        }));
      }

      console.log('Sending to backend...');
      const response = await analyzeImages(imageFiles);
      console.log('Backend response:', response);

      if (response.success && response.data) {
        const data = response.data;
        
        // Auto-fill form with extracted data
        if (data.productName) setProductName(data.productName);
        if (data.mfgDate) setMfgDate(data.mfgDate);
        if (data.expDate) setExpDate(data.expDate);
        if (data.ingredients && data.ingredients.length > 0) {
          setIngredients(data.ingredients.join(', '));
        }

        Alert.alert('Success', 'Product information extracted!');
        setStep(3); // Move to review step
      } else {
        Alert.alert('Analysis Failed', 'Could not extract product information');
        setStep(1);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = 'Failed to analyze images. ';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        errorMessage += error.response.data?.message || error.response.data?.error || 'Server error';
      } else if (error.request) {
        errorMessage += 'No response from server. Is backend running?';
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert('Error', errorMessage);
      setStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!productName.trim()) {
      Alert.alert('Missing Info', 'Please enter product name');
      return;
    }
    if (!expDate.trim()) {
      Alert.alert('Missing Info', 'Please enter expiry date');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expDate)) {
      Alert.alert('Invalid Date', 'Expiry date must be in YYYY-MM-DD format\nExample: 2024-12-31');
      return;
    }
    if (mfgDate && !dateRegex.test(mfgDate)) {
      Alert.alert('Invalid Date', 'Manufacturing date must be in YYYY-MM-DD format\nExample: 2024-01-01');
      return;
    }

    setAnalyzing(true);

    try {
      // Parse ingredients
      const ingredientList = ingredients
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      // Get health rating if ingredients provided
      let rating = 3;
      let goodContents = [];
      let badContents = [];
      let healthSummary = '';

      if (ingredientList.length > 0) {
        try {
          console.log('Getting health rating...');
          const ratingResponse = await rateProduct(ingredientList, productName);
          console.log('Rating response:', ratingResponse);
          
          if (ratingResponse.success && ratingResponse.analysis) {
            rating = ratingResponse.analysis.rating || 3;
            goodContents = ratingResponse.analysis.goodContents || [];
            badContents = ratingResponse.analysis.badContents || [];
            healthSummary = ratingResponse.analysis.summary || '';
          }
        } catch (ratingError) {
          console.error('Rating error:', ratingError);
          // Continue without rating
        }
      }

      // Prepare product data
      const productData = {
        name: productName.trim(),
        mfgDate: mfgDate.trim() || new Date().toISOString().split('T')[0],
        expDate: expDate.trim(),
        ingredients: ingredientList,
        rating,
        goodContents,
        badContents,
        healthSummary,
        createdAt: editProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Saving product:', productData);
      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save product: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Step 1: Upload Product Images
      </Text>

      <View style={styles.imageButtons}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImages}>
          <Text style={styles.imageButtonIcon}>📷</Text>
          <Text style={styles.imageButtonText}>Gallery</Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonIcon}>📸</Text>
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedImages.length > 0 && (
        <View style={styles.imagePreview}>
          <Text style={[styles.label, { color: theme.text }]}>
            ✓ {selectedImages.length} image(s) selected
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedImages.length === 0 && styles.buttonDisabled
        ]}
        onPress={handleAnalyzeImages}
        disabled={selectedImages.length === 0}
      >
        <Text style={styles.buttonText}>🔍 Analyze Images</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => setStep(3)}
      >
        <Text style={[styles.manualButtonText, { color: theme.primary }]}>
          ✏️ Enter Manually
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Analyzing Images...
      </Text>
      <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      <Text style={[styles.loadingText, { color: theme.textMuted }]}>
        Extracting product information using AI
      </Text>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.formScroll}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Review & Save
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.text }]}>Product Name *</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g., Organic Whole Wheat Bread"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Mfg Date
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            value={mfgDate}
            onChangeText={setMfgDate}
            placeholder="2024-01-01"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.formGroup, styles.formGroupHalf]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Exp Date *
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            value={expDate}
            onChangeText={setExpDate}
            placeholder="2024-12-31"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.text }]}>
          Ingredients (comma-separated)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }
          ]}
          value={ingredients}
          onChangeText={setIngredients}
          placeholder="wheat flour, water, yeast, salt"
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.saveButton, analyzing && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={analyzing}
        >
          {analyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {editProduct ? '💾 Update' : '✅ Save'} Product
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  imagePreview: {
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  manualButton: {
    padding: 16,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  formScroll: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    marginTop: 24,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});