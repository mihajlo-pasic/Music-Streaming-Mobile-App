// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JELLYFIN_URL } from "@env";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { RootStackParamList } from "../navigation";
import { StackNavigationProp } from "@react-navigation/stack";

interface Album {
  id: string;
  title: string;
  imageUrl: string;
}

export default function HomeScreen({ route }: any) {
  const { token, userName, userId } = route.params;
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Album[]>([]);
  const [favorites, setFavorites] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { "X-Emby-Token": token };
  type HomeNavProp = StackNavigationProp<RootStackParamList, "Main">;
  const navigation = useNavigation<HomeNavProp>();

  useEffect(() => {
    async function fetchAll() {
      try {
        // 1) Avatar
        const uri = `${JELLYFIN_URL}/Users/${userId}/Images/Primary?maxHeight=200&tag=Primary&quality=90`;
        setAvatarUrl(`${uri}&api_key=${token}`);

        // 2) Playlists (first 3)
        const pl = await axios.get(`${JELLYFIN_URL}/Users/${userId}/Items`, {
          headers,
          params: {
            IncludeItemTypes: "Playlist",
            Recursive: true,
            SortBy: "DateCreated",
            SortOrder: "Descending",
            Limit: 3,
          },
        });
        const pls: Album[] = pl.data.Items.map((it: any) => ({
          id: it.Id,
          title: it.Name,
          imageUrl: `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=200&tag=Primary&quality=90&api_key=${token}`,
        }));
        setPlaylists(pls);

        // 3) Favorites (only audio items filtered by IsFavorite)
        const favRes = await axios.get(
          `${JELLYFIN_URL}/Users/${userId}/Items`,
          {
            headers,
            params: {
              Recursive: true,
              Filters: "IsFavorite",
              IncludeItemTypes: "Audio",
              SortBy: "DateCreated",
              SortOrder: "Descending",
            },
          }
        );
        const favs: Album[] = favRes.data.Items.map((it: any) => ({
          id: it.Id,
          title: it.Name,
          imageUrl: `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=200&tag=Primary&quality=90&api_key=${token}`,
        }));
        setFavorites(favs);
      } catch (e) {
        console.warn("Fetch error:", (e as any).message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [userId, token]);

  if (loading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        {avatarUrl && (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        )}
        <Text style={styles.greeting}>Hi, {userName}</Text>
      </View>

      {/* Your Playlists */}
      <Text style={styles.sectionTitle}>Your Playlists</Text>
      <FlatList
        data={playlists}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingLeft: 16 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.card,
              index === playlists.length - 1 && { marginRight: 16 },
            ]}
            onPress={() =>
              navigation.navigate("PlaylistDetail", {
                playlistId: item.id,
                playlistName: item.title,
                token,
                userId,
              })
            }
          >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <Text style={styles.cardText} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Favorites */}
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Favorites</Text>
      <TouchableOpacity
        style={styles.favBox}
        onPress={() =>
          navigation.navigate("Favorites", {
            favorites,
            token,
            userId,
          })
        }
      >
        <Text style={styles.favText}>
          ❤ {favorites.length} favorite song
          {favorites.length === 1 ? "" : "s"}
        </Text>
      </TouchableOpacity>

      {/* Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>
          “Where words fail, music speaks.” 🎶
        </Text>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
// three cards, 16px side padding + 12px between cards
const CARD_W = (width - 32 - 24) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  greeting: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 16,
    marginBottom: 8,
  },

  card: {
    width: CARD_W,
    marginRight: 12,
  },
  cardImage: {
    width: "100%",
    height: CARD_W,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  cardText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },

  favBox: {
    marginHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 170,
  },
  favText: {
    color: "#fff",
    fontSize: 16,
  },

  quoteContainer: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 32,
  },
  quoteText: {
    color: "#aaa",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 100,
  },
});
