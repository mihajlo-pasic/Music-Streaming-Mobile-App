// src/screens/AlbumDetailScreen.tsx
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

type AlbumRouteProp = RouteProp<RootStackParamList, "AlbumDetail">;
type AlbumNavProp = StackNavigationProp<RootStackParamList, "AlbumDetail">;

interface Track {
  id: string;
  name: string;
  imageUrl: string;
}

export default function AlbumDetailScreen({
  route,
}: {
  route: AlbumRouteProp;
}) {
  const { albumId, albumName, artistName, token, userId } = route.params;
  const navigation = useNavigation<AlbumNavProp>();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // fetch only audio items in this album
        const res = await axios.get(`${JELLYFIN_URL}/Users/${userId}/Items`, {
          headers: { "X-Emby-Token": token },
          params: {
            Recursive: true,
            IncludeItemTypes: "Audio",
            AlbumIds: albumId,
            SortBy: "SortName",
            SortOrder: "Ascending",
          },
        });
        const items: Track[] = res.data.Items.map((it: any) => ({
          id: it.Id,
          name: it.Name,
          imageUrl: `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=80&tag=Primary&quality=90&api_key=${token}`,
        }));
        setTracks(items);
      } catch (e) {
        Alert.alert("Error", "Could not load album tracks.");
      } finally {
        setLoading(false);
      }
    })();
  }, [albumId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header showing artist – album */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {artistName} – {albumName}
        </Text>
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              stop();
              navigation.navigate("Player", {
                itemId: item.id,
                name: item.name,
                imageUrl: item.imageUrl,
                token,
                userId,
                queue: tracks.map((t) => ({
                  id: t.id,
                  name: t.name,
                  imageUrl: t.imageUrl,
                })),
                index,
              });
            }}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.img} />
            <Text style={styles.txt} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No songs in this album.</Text>
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
    fontSize: 18,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  img: { width: 50, height: 50, borderRadius: 4, marginRight: 12 },
  txt: { color: "#fff", flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { color: "#888" },
});
