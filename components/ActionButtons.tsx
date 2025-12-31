import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionButtonsProps {
  vehicleId?: string;
  onStartEngine: () => void;
  onSOS: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  vehicleId,
  onStartEngine,
  onSOS,
}) => {
  const handleStartEngine = () => {
    if (!vehicleId) {
      Alert.alert('No Vehicle', 'Please select a vehicle first.');
      return;
    }
    onStartEngine();
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 SOS Emergency',
      'Send emergency alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: onSOS },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Start Engine Button */}
      <TouchableOpacity
        style={styles.engineButton}
        onPress={handleStartEngine}
        activeOpacity={0.8}
      >
        <Ionicons name="power" size={22} color="#FFF" />
        <Text style={styles.engineText}>Start Engine</Text>
      </TouchableOpacity>

      {/* SOS Button */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={handleSOS}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  engineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  engineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sosButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sosText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default ActionButtons;
