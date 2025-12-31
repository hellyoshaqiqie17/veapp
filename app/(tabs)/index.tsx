import FleetMap from '@/components/FleetMap';
import { useAuth } from '@/hooks/useAuth';
import { equalTo, onValue, orderByChild, push, query, ref, remove, rtdb, set, update } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  plateNumber?: string;
  status?: string;
  address?: string;
  time?: string;
  isEngineOn?: boolean;
  isOverSpeed?: boolean;
  imageUrl?: string;
  userId?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function FleetManagementScreen() {
  const { driver, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isInitializedRef = React.useRef(false);

  useEffect(() => {
    if (!driver?.userId) return;

    const vehiclesRef = query(ref(rtdb, 'Vehicle'), orderByChild('userId'), equalTo(driver.userId));
    const unsubscribe = onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const vehicleList: Vehicle[] = Object.keys(data).map((key) => {
          const vehicleData = data[key];
          return {
            id: key,
            lat: vehicleData.lat || vehicleData.latitude || 0,
            lng: vehicleData.lng || vehicleData.longitude || vehicleData.long || 0,
            name: vehicleData.name || 'Unknown Vehicle',
            plateNumber: vehicleData.plateNumber || '',
            status: vehicleData.status || 'Offline',
            address: vehicleData.address || 'Unknown Location',
            time: vehicleData.time || 'Just Now',
            isEngineOn: vehicleData.isEngineOn || false,
            isOverSpeed: vehicleData.isOverSpeed || false,
            imageUrl: vehicleData.imageUrl,
            userId: vehicleData.userId,
          };
        });
        setVehicles(vehicleList);
        
        if (!isInitializedRef.current && vehicleList.length > 0) {
          setSelectedVehicle(vehicleList[0]);
          isInitializedRef.current = true;
        }
      } else {
        setVehicles([]);
      }
    }, (error) => {
      console.error("Error fetching vehicles: ", error);
      Alert.alert('Error', 'Failed to connect to Realtime Database');
    });

    return () => unsubscribe();
  }, [driver?.userId]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const vehicleIndex = vehicles.findIndex(v => v.id === vehicle.id);
    if (vehicleIndex !== -1 && scrollViewRef.current) {
      const scrollX = vehicleIndex * (CARD_WIDTH + 16);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  };

  // Get vehicle image based on name/brand
  const getVehicleImage = (vehicleName: string) => {
    const name = vehicleName.toLowerCase();
    if (name.includes('fortuner')) {
      return require('@/assets/images/marker/vehicle-photo/Fortuner.png');
    } else if (name.includes('pajero')) {
      return require('@/assets/images/marker/vehicle-photo/pajero.png');
    } else if (name.includes('peugeot')) {
      return require('@/assets/images/marker/vehicle-photo/peugeot.png');
    }
    // Default fallback
    return require('@/assets/images/marker/vehicle-photo/Fortuner.png');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleToggleEngine = async (vehicle: Vehicle) => {
    try {
      const vehicleRef = ref(rtdb, `Vehicle/${vehicle.id}`);
      await update(vehicleRef, {
        isEngineOn: !vehicle.isEngineOn
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update engine status');
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const vehicleRef = ref(rtdb, `Vehicle/${vehicle.id}`);
              await remove(vehicleRef);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  const handleAddTestVehicle = async () => {
    if (!driver?.userId) {
      Alert.alert('Error', 'You must be logged in to add a vehicle');
      return;
    }

    const BRANDS = ['Peugeot', 'Toyota', 'Honda', 'Mitsubishi', 'Suzuki'];
    const MODELS = ['308', 'Fortuner', 'CR-V', 'Pajero', 'Ertiga'];
    const PLATES = ['L 1234 AB', 'L 5678 CD', 'L 9012 EF', 'L 3456 GH', 'L 7890 IJ'];
    const IMAGES = [
      'https://purepng.com/public/uploads/large/purepng.com-red-ferrari-458-italia-carcarferrarivehicletransport-9615246635940x7m2.png',
      'https://purepng.com/public/uploads/large/purepng.com-blue-bmw-m4-gts-carcarbmwvehicletransport-961524663046k3c6k.png',
      'https://purepng.com/public/uploads/large/purepng.com-silver-audi-r8-carcaraudivehicletransport-961524654552j9z5l.png',
      'https://purepng.com/public/uploads/large/purepng.com-black-ford-mustang-carcarfordvehicletransport-9615246535080y6w0.png',
      'https://purepng.com/public/uploads/large/purepng.com-white-audi-a5-sportback-carcaraudivehicletransport-961524654869j8yv2.png',
    ];
    
    const idx = Math.floor(Math.random() * BRANDS.length);
    const lat = -7.2575 + (Math.random() - 0.5) * 0.04;
    const lng = 112.7521 + (Math.random() - 0.5) * 0.04;

    try {
      const newVehicleRef = push(ref(rtdb, 'Vehicle'));
      await set(newVehicleRef, {
        name: `${BRANDS[idx]} ${MODELS[idx]}`,
        lat: lat,
        lng: lng,
        status: Math.random() > 0.5 ? 'Stopped' : 'Offline',
        plateNumber: PLATES[idx],
        isEngineOn: Math.random() > 0.3,
        isOverSpeed: Math.random() > 0.8,
        time: 'Just Now',
        address: 'Surabaya, Indonesia',
        imageUrl: IMAGES[idx % IMAGES.length],
        userId: driver.userId
      });
      Alert.alert('Success', `Added ${BRANDS[idx]} to Fleet`);
    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert('Error', 'Could not add vehicle. Check permissions.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <FleetMap
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={handleSelectVehicle}
          centerCoordinate={[112.7521, -7.2575]}
        />
      </View>

      {/* Vehicle Count Badge - Positioned above cards */}
      {vehicles.length > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{vehicles.length - 1} More</Text>
        </View>
      )}    

      {/* Top Floating Bar */}
      <SafeAreaView style={styles.topContainer} pointerEvents="box-none">
        <View style={[styles.searchBarContainer, { justifyContent: 'space-between' }]}>
          <TouchableOpacity style={styles.notificationButton} onPress={handleAddTestVehicle}>
            <Ionicons name="add" size={22} color="#1E293B" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: '#FEE2E2' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Floating Cards */}
      <View style={styles.bottomContainer} pointerEvents="box-none">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          contentContainerStyle={styles.cardsScroll}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
            if (vehicles[index]) {
              handleSelectVehicle(vehicles[index]);
            }
          }}
        >
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.cardContent}>
                {/* Vehicle Image */}
                <Image 
                  source={getVehicleImage(vehicle.name || '')} 
                  style={styles.vehicleImage}
                  resizeMode="contain"
                />
                
                {/* Vehicle Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.headerRow}>
                    <View style={styles.titleSection}>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      <Text style={styles.vehicleStatus}>{vehicle.status}</Text>
                    </View>
                    <Text style={styles.timeText}>{vehicle.time}</Text>
                  </View>
                  
                  <Text style={styles.vehicleAddress} numberOfLines={2}>
                    {vehicle.address}
                  </Text>
                  
                  {/* Status Indicators */}
                  <View style={styles.statusIndicators}>
                    <TouchableOpacity 
                      style={styles.statusItem} 
                      onPress={() => handleToggleEngine(vehicle)}
                    >
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: vehicle.isEngineOn ? '#22C55E' : '#94A3B8' }
                      ]} />
                      <Text style={styles.statusLabel}>Switch {vehicle.isEngineOn ? 'On' : 'Off'}</Text>
                    </TouchableOpacity>

                    <View style={styles.statusItem}>
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: vehicle.isOverSpeed ? '#EF4444' : '#94A3B8' }
                      ]} />
                      <Text style={styles.statusLabel}>Over Speed</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Count Badge - FIXED: Increased bottom value to position above cards
  countBadge: {
    position: 'absolute',
    right: 16,
    bottom: 280, // Changed from 240 to 280 to position above the card
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Top Bar
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    zIndex: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '400',
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  
  // Bottom Cards
  bottomContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cardsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  vehicleCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vehicleImage: {
    width: 90,
    height: 55,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  vehicleStatus: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
  vehicleAddress: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 6,
    marginBottom: 12,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
});
