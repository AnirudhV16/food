// frontend/components/RecipeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateRecipes, getRecipeDetails } from '../services/api';

export default function RecipeScreen({ theme, darkMode }) {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recipeHistory, setRecipeHistory] = useState([]);

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
      }
    );

    return () => unsubscribe();
  }, []);

  // Load recipe history
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'recipeHistory'),
      (snapshot) => {
        const history = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        setRecipeHistory(history);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleGenerateRecipes = async () => {
    if (selectedItems.length === 0 && !customIngredient.trim()) {
      Alert.alert('Error', 'Please select ingredients or add custom ones');
      return;
    }

    setLoading(true);
    try {
      const ingredientNames = selectedItems.map(id => {
        const product = products.find(p => p.id === id);
        return product?.name;
      }).filter(Boolean);

      const customIngredients = customIngredient
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      const response = await generateRecipes(ingredientNames, customIngredients);
      
      if (response.success && response.recipes) {
        setGeneratedRecipes(response.recipes);
      } else {
        Alert.alert('Error', 'Failed to generate recipes');
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      Alert.alert('Error', 'Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = async (recipe) => {
    setLoading(true);
    try {
      const ingredientNames = selectedItems.map(id => {
        const product = products.find(p => p.id === id);
        return product?.name;
      }).filter(Boolean);

      const response = await getRecipeDetails(recipe.name, ingredientNames);
      
      if (response.success && response.recipe) {
        setSelectedRecipe(response.recipe);
        
        // Save to history
        // await addDoc(collection(db, 'recipeHistory'), {
        //   name: recipe.name,
        //   ingredients: ingredientNames,
        //   createdAt: new Date().toISOString()
        // });
      } else {
        Alert.alert('Error', 'Failed to get recipe details');
      }
    } catch (error) {
      console.error('Recipe details error:', error);
      Alert.alert('Error', 'Failed to get recipe details');
    } finally {
      setLoading(false);
    }
  };

  const renderIngredientSelection = () => (
    <View>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Select Ingredients
      </Text>
      
      {products.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No products available. Add products first.
        </Text>
      ) : (
        products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.checkboxItem,
              { borderColor: theme.border },
              selectedItems.includes(product.id) && styles.checkboxItemSelected
            ]}
            onPress={() => toggleItem(product.id)}
          >
            <View style={[
              styles.checkbox,
              { borderColor: theme.border },
              selectedItems.includes(product.id) && styles.checkboxChecked
            ]}>
              {selectedItems.includes(product.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
              {product.name}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Add custom ingredients (e.g., eggs, salt)"
        placeholderTextColor={theme.textMuted}
        value={customIngredient}
        onChangeText={setCustomIngredient}
      />

      <TouchableOpacity
        style={[
          styles.generateButton,
          (selectedItems.length === 0 && !customIngredient.trim()) && styles.buttonDisabled
        ]}
        onPress={handleGenerateRecipes}
        disabled={selectedItems.length === 0 && !customIngredient.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>🍳 Generate Recipes</Text>
        )}
      </TouchableOpacity>

      {generatedRecipes.length > 0 && (
        <View style={styles.recipesContainer}>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Suggested Recipes:
          </Text>
          {generatedRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleSelectRecipe(recipe)}
            >
              <View style={styles.recipeCardContent}>
                <View>
                  <Text style={[styles.recipeName, { color: theme.text }]}>
                    {recipe.name}
                  </Text>
                  <Text style={[styles.recipeInfo, { color: theme.textMuted }]}>
                    {recipe.time} • {recipe.difficulty}
                  </Text>
                  {recipe.description && (
                    <Text style={[styles.recipeDescription, { color: theme.textMuted }]}>
                      {recipe.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecipeDetails = () => (
    <View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSelectedRecipe(null);
          setGeneratedRecipes([]);
        }}
      >
        <Text style={styles.backButtonText}>← Back to recipes</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>
        {selectedRecipe.name}
      </Text>

      {selectedRecipe.prepTime && (
        <Text style={[styles.recipeInfo, { color: theme.textMuted }]}>
          Prep: {selectedRecipe.prepTime} • Cook: {selectedRecipe.cookTime} • Servings: {selectedRecipe.servings}
        </Text>
      )}

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Ingredients:
      </Text>
      {selectedRecipe.ingredients.map((ingredient, index) => (
        <Text key={index} style={[styles.listItem, { color: theme.text }]}>
          • {ingredient}
        </Text>
      ))}

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Instructions:
      </Text>
      {selectedRecipe.steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <Text style={[styles.stepNumber, { color: theme.primary }]}>
            {index + 1}.
          </Text>
          <Text style={[styles.stepText, { color: theme.text }]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderHistory = () => (
    <View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowHistory(false)}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>
        Recipe History
      </Text>

      {recipeHistory.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No recipe history yet
        </Text>
      ) : (
        recipeHistory.map((recipe) => (
          <View
            key={recipe.id}
            style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.recipeName, { color: theme.text }]}>
              {recipe.name}
            </Text>
            <Text style={[styles.historyDate, { color: theme.textMuted }]}>
              {new Date(recipe.createdAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.historyIngredients, { color: theme.textMuted }]}>
              {recipe.ingredients.join(', ')}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {showHistory ? (
          renderHistory()
        ) : selectedRecipe ? (
          renderRecipeDetails()
        ) : (
          renderIngredientSelection()
        )}
      </ScrollView>

      {!showHistory && !selectedRecipe && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyButtonText}>📜</Text>
        </TouchableOpacity>
      )}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recipesContainer: {
    marginTop: 24,
  },
  recipeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  recipeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: '#3B82F6',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 24,
  },
  stepText: {
    fontSize: 16,
    flex: 1,
  },
  historyButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  historyButtonText: {
    fontSize: 24,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyIngredients: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
});