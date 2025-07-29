// src/screens/PlaylistDetailScreen.tsx
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

type PlaylistRouteProp = RouteProp<RootStackParamList, "PlaylistDetail">;
type PlaylistNavProp = StackNavigationProp<
  RootStackParamList,
  "PlaylistDetail"
>;

interface Track {
  id: string;
  name: string;
  imageUrl: string;
}

export default function PlaylistDetailScreen({
  route,
}: {
  route: PlaylistRouteProp;
}) {
  const { playlistId, token, userId } = route.params;
  const navigation = useNavigation<PlaylistNavProp>();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${JELLYFIN_URL}/Playlists/${playlistId}/Items`,
          {
            headers: { "X-Emby-Token": token },
            params: {
              UserId: userId,
              SortBy: "SortName",
              IncludeItemTypes: "Audio",
            },
          }
        );
        const items: Track[] = res.data.Items.map((it: any) => ({
          id: it.Id,
          name: it.Name,
          imageUrl: `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=80&tag=Primary&quality=90&api_key=${token}`,
        }));
        setTracks(items);
      } catch (e: any) {
        Alert.alert("Error", "Could not load playlist.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const removeTrack = async (trackId: string) => {
    try {
      await axios.delete(`${JELLYFIN_URL}/Playlists/${playlistId}/Items`, {
        headers: { "X-Emby-Token": token },
        params: {
          // promijenjeno ovdje:
          entryIds: trackId,
          userId,
        },
      });
      // filtriraj ga iz stanja
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch (e) {
      console.warn("Remove failed:", e);
      Alert.alert("Error", "Could not remove track.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => {
                stop();
                navigation.navigate("Player", {
                  // obavezna polja iz tipa:
                  itemId: item.id,
                  name: item.name,
                  imageUrl: item.imageUrl,
                  token,
                  userId,
                  // queue i index
                  queue: tracks.map((t) => ({
                    id: t.id,
                    name: t.name,
                    imageUrl: t.imageUrl,
                  })),
                  index,
                });
              }}
              style={styles.trackInfo}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.img} />
              <Text style={styles.txt} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeTrack(item.id)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No tracks in this playlist.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "#333",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trackInfo: { flexDirection: "row", flex: 1, alignItems: "center" },
  img: { width: 50, height: 50, borderRadius: 4, marginRight: 12 },
  txt: { color: "#fff", flex: 1 },
  removeBtn: { padding: 8 },
  removeTxt: { color: "#e74c3c", fontSize: 14 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { color: "#888" },
});
