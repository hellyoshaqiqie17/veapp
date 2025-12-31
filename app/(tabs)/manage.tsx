import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ManageScreen() {
  return (
    <View style={styles.container}>
      <Text>Manage Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
