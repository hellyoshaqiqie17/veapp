import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  plateNumber?: string;
  status?: string;
  speed?: number;
  lastUpdate?: string;
}

interface VehiclePanelProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const VehiclePanel: React.FC<VehiclePanelProps> = ({ vehicle, onClose }) => {
  if (!vehicle) return null;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return Colors.success;
      case 'idle':
        return Colors.warning;
      case 'offline':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport" size={24} color={Colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.vehicleName}>{vehicle.name || 'Vehicle'}</Text>
            <Text style={styles.plateNumber}>{vehicle.plateNumber || vehicle.id}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle.status) }]} />
          <Text style={styles.statLabel}>Status</Text>
          <Text style={styles.statValue}>{vehicle.status || 'Unknown'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={18} color={Colors.primary} />
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{vehicle.speed || 0} km/h</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Ionicons name="location-outline" size={18} color={Colors.primary} />
          <Text style={styles.statLabel}>Location</Text>
          <Text style={styles.statValue}>{vehicle.lat?.toFixed(3)}, {vehicle.lng?.toFixed(3)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  plateNumber: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});

export default VehiclePanel;
