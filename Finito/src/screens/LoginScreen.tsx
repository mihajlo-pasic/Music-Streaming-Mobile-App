// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";
import { JELLYFIN_URL } from "@env";

type LoginNavProp = StackNavigationProp<RootStackParamList, "Login">;
type Props = {
  navigation: LoginNavProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!user || !pass) {
      return Alert.alert("Error", "Insert your username and password.");
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${JELLYFIN_URL}/Users/AuthenticateByName`,
        { Username: user, Pw: pass },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Emby-Authorization": `MediaBrowser Client="Finito", Device="Mobile", DeviceId="finito-device", Version="1.0.0"`,
          },
        }
      );
      const { AccessToken, User } = res.data;
      setLoading(false);
      navigation.replace("Main", {
        token: AccessToken,
        userName: User.Name,
        userId: User.Id,
      });
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Login failed", e.response?.data?.Message || e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Text style={styles.title}>FINITO</Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        value={user}
        onChangeText={setUser}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={pass}
        onChangeText={setPass}
        style={styles.input}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1DB954"
          style={{ marginTop: 16 }}
        />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 36,
    color: "#fff",
    marginBottom: 32,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    backgroundColor: "#1E1E1E",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
