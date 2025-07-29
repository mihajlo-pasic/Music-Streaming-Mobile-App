// src/screens/ArtistDetailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";
import { stop } from "../utils/AudioManager";
import { JELLYFIN_URL } from "@env";

type ArtistRouteProp = RouteProp<RootStackParamList, "ArtistDetail">;
type ArtistNavProp = StackNavigationProp<RootStackParamList, "ArtistDetail">;

interface Album {
  id: string;
  name: string;
  imageUrl: string;
}

export default function ArtistDetailScreen({
  route,
}: {
  route: ArtistRouteProp;
}) {
  const { artistId, artistName, token, userId } = route.params;
  const navigation = useNavigation<ArtistNavProp>();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${JELLYFIN_URL}/Users/${userId}/Items`, {
          headers: { "X-Emby-Token": token },
          params: {
            Recursive: true,
            IncludeItemTypes: "MusicAlbum",
            ArtistIds: artistId,
            SortBy: "DateCreated",
            SortOrder: "Descending",
          },
        });
        const items: Album[] = res.data.Items.map((it: any) => ({
          id: it.Id,
          name: it.Name,
          imageUrl: `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=120&tag=Primary&quality=90&api_key=${token}`,
        }));
        setAlbums(items);
      } catch (e) {
        Alert.alert("Error", "Could not load artist's albums.");
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{artistName}</Text>
      </View>

      <FlatList
        data={albums}
        keyExtractor={(a) => a.id}
        horizontal={false}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("AlbumDetail", {
                albumId: item.id,
                albumName: item.name,
                artistName,
                token,
                userId,
              })
            }
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No albums found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  card: {
    flex: 1,
    margin: 8,
    alignItems: "center",
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  name: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16 },
});
