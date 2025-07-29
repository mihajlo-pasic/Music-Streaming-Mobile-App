// src/screens/ProfileScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation";
import { JELLYFIN_URL } from "@env";

type ProfileRouteProp = RouteProp<RootStackParamList, "Main">;
type ProfileNavProp = StackNavigationProp<RootStackParamList, "Login">;

export default function ProfileScreen() {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<ProfileNavProp>();
  const { userId, userName, token } = route.params;

  const avatarUrl = `${JELLYFIN_URL}/Users/${userId}/Images/Primary?maxHeight=200&tag=Primary&quality=90&api_key=${token}`;

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <Text style={styles.username}>{userName}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#1DB954",
    marginBottom: 24,
  },
  username: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 40,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
