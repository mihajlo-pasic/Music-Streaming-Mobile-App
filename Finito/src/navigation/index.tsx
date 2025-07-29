// src/navigation/index.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlayerScreen from "../screens/PlayerScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import PlaylistDetailScreen from "../screens/PlaylistDetailScreen";
import AlbumDetailScreen from "../screens/AlbumDetailScreen";
import ArtistDetailScreen from "../screens/ArtistDetailScreen";

export type RootStackParamList = {
  Login: undefined;
  Main: { token: string; userName: string; userId: string };
  Favorites: {
    favorites: {
      id: string;
      title: string;
      imageUrl: string;
    }[];
    token: string;
    userId: string;
  };
  PlaylistDetail: {
    playlistId: string;
    playlistName: string;
    token: string;
    userId: string;
  };
  AlbumDetail: {
    albumId: string;
    albumName: string;
    artistName: string;
    token: string;
    userId: string;
  };
  ArtistDetail: {
    artistId: string;
    artistName: string;
    token: string;
    userId: string;
  };
  Player: {
    itemId: string;
    name: string;
    imageUrl: string;
    token: string;
    userId: string;
    queue: { id: string; name: string; imageUrl: string }[]; // <-- queue
    index: number;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs({ route }: any) {
  const { token, userName, userId } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] = "home";

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Search") {
            iconName = "search";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#1DB954",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userName, token, userId }}
      />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        initialParams={{ token, userId }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ userName, token, userId }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: "My Favorites" }}
        />
        <Stack.Screen
          name="PlaylistDetail"
          component={PlaylistDetailScreen}
          options={({ route }) => ({ title: route.params.playlistName })}
        />
        <Stack.Screen
          name="AlbumDetail"
          component={AlbumDetailScreen}
          options={({ route }) => ({
            title: `${route.params.artistName} – ${route.params.albumName}`,
          })}
        />
        <Stack.Screen
          name="ArtistDetail"
          component={ArtistDetailScreen}
          options={({ route }) => ({
            title: route.params.artistName,
          })}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            headerShown: true,
            title: "Now Playing",
            presentation: "modal", // da se otvori preko cele stranice
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
