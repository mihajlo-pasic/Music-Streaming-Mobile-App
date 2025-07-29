// src/screens/PlayerScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { JELLYFIN_URL } from "@env";
import { RootStackParamList } from "../navigation";

type PlayerRouteProp = RouteProp<RootStackParamList, "Player">;
type PlayerNavProp = StackNavigationProp<RootStackParamList, "Player">;

interface Playlist {
  Id: string;
  Name: string;
}

export default function PlayerScreen({ route }: { route: PlayerRouteProp }) {
  const { queue, index: startIndex, token, userId } = route.params;
  const navigation = useNavigation<PlayerNavProp>();

  // REF na trenutno aktivan sound
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // for “Add to Playlist” modal
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // remember if we've loaded once
  const hasLoadedRef = useRef(false);

  // kad god se zvuk promijeni, preslušaj event napuštanja ekrana
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", async () => {
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {}
      }
    });
    return unsubscribe;
  }, [navigation, sound]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const current = queue[currentIndex];

      // 1) fetch favorite‐status
      try {
        const favRes = await axios.get(
          `${JELLYFIN_URL}/Users/${userId}/Items`,
          {
            headers: { "X-Emby-Token": token },
            params: {
              Recursive: true,
              Filters: "IsFavorite",
              IncludeItemTypes: "Audio",
            },
          }
        );
        const favIds: string[] = favRes.data.Items.map((i: any) => i.Id);
        if (!cancelled) setIsFavorited(favIds.includes(current.id));
      } catch (e: any) {
        console.warn("Could not fetch favorites:", e.message);
      }

      // 2) get PlaybackInfo & build stream URL
      let streamUrl: string | null = null;
      try {
        const infoRes = await axios.get(
          `${JELLYFIN_URL}/Items/${current.id}/PlaybackInfo`,
          {
            headers: { "X-Emby-Token": token },
            params: { UserId: userId },
          }
        );
        const ms = infoRes.data.MediaSources[0];
        streamUrl =
          `${JELLYFIN_URL}/Audio/${current.id}/stream.${ms.Container}` +
          `?MediaSourceId=${ms.Id}&api_key=${token}`;
      } catch (e) {
        console.error("PlaybackInfo error:", (e as any).message);
        Alert.alert("Playback error", "Could not get playback info.");
      }

      if (!streamUrl) {
        setLoading(false);
        return;
      }

      // 3) unload old if already loaded
      if (hasLoadedRef.current && sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // 4) create & play new Sound
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true }
        );
        if (cancelled) {
          await newSound.unloadAsync();
          return;
        }
        setSound(newSound);
        setPlaying(true);
        hasLoadedRef.current = true;
      } catch (e) {
        console.error("Audio play error:", (e as any).message);
        Alert.alert("Playback error", "Could not play track.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      sound?.unloadAsync();
    };
  }, [currentIndex]);

  const togglePlay = async () => {
    if (!sound) return;
    if (playing) {
      await sound.pauseAsync();
      setPlaying(false);
    } else {
      await sound.playAsync();
      setPlaying(true);
    }
  };

  const toggleFavorite = async () => {
    const currentId = queue[currentIndex].id;
    const endpoint = `${JELLYFIN_URL}/Users/${userId}/FavoriteItems/${currentId}`;
    const config = {
      headers: { "X-Emby-Token": token },
      params: { userId },
    };

    try {
      if (isFavorited) {
        // remove
        await axios.delete(endpoint, config);
      } else {
        // add
        await axios.post(endpoint, null, config);
      }
      setIsFavorited((f) => !f);
    } catch (e: any) {
      console.error("Favorite toggle failed:", e.response?.status, e.message);
      Alert.alert("Error", "Couldn't update favorite status.");
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${JELLYFIN_URL}/Users/${userId}/Items`, {
        headers: { "X-Emby-Token": token },
        params: { IncludeItemTypes: "Playlist", Recursive: true },
      });
      const pls: Playlist[] = res.data.Items.map((it: any) => ({
        Id: it.Id,
        Name: it.Name,
      }));
      setPlaylists(pls);
    } catch (e) {
      console.warn("Could not load playlists:", (e as any).message);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    const currentId = queue[currentIndex].id;
    try {
      await axios.post(`${JELLYFIN_URL}/Playlists/${playlistId}/Items`, null, {
        headers: { "X-Emby-Token": token },
        params: { ids: currentId, userId },
      });
      Alert.alert("Success", "Added to playlist!");
    } catch (e: any) {
      console.error("Add to playlist failed:", e.response?.status, e.message);
      Alert.alert("Error", "Could not add to playlist.");
    }
    setModalVisible(false);
  };

  const createAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      return Alert.alert("Name required", "Please enter a playlist name.");
    }
    try {
      const create = await axios.post(
        `${JELLYFIN_URL}/Playlists`,
        { Name: newPlaylistName, UserId: userId },
        { headers: { "X-Emby-Token": token } }
      );
      const newId = create.data.Id;
      await addToPlaylist(newId);
      setNewPlaylistName("");
    } catch (e) {
      console.error("Create playlist failed:", (e as any).message);
      Alert.alert("Error", "Could not create playlist.");
    }
  };

  const openModal = async () => {
    await fetchPlaylists();
    setModalVisible(true);
  };

  const playNext = () => {
    if (currentIndex + 1 < queue.length) setCurrentIndex((i) => i + 1);
  };
  const playPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  const track = queue[currentIndex];

  return (
    <View style={styles.container}>
      <Image source={{ uri: track.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{track.name}</Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={28}
            color={isFavorited ? "#1DB954" : "#fff"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={playPrev}>
          <Ionicons name="play-skip-back" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
          <Ionicons
            name={playing ? "pause-circle" : "play-circle"}
            size={48}
            color="#1DB954"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext}>
          <Ionicons name="play-skip-forward" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openModal}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Close dugme */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={async () => {
          if (sound) {
            try {
              await sound.stopAsync();
              await sound.unloadAsync();
            } catch {}
          }
          navigation.goBack();
        }}
      >
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>

      {/* Add‐to‐Playlist Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add to Playlist</Text>

            <FlatList
              data={playlists}
              keyExtractor={(p) => p.Id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => addToPlaylist(item.Id)}
                >
                  <Text style={styles.playlistText}>{item.Name}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.divider} />

            <TextInput
              style={styles.input}
              placeholder="New playlist name"
              placeholderTextColor="#888"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity style={styles.createBtn} onPress={createAndAdd}>
              <Text style={styles.createTxt}>Create and Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeModal}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 12,
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  playButton: {
    marginHorizontal: 12,
  },
  closeButton: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000a",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  playlistRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  playlistText: {
    color: "#fff",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 12,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  createBtn: {
    backgroundColor: "#1DB954",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 8,
  },
  createTxt: {
    color: "#fff",
    fontWeight: "600",
  },
  closeModal: {
    alignItems: "center",
    padding: 8,
  },
});
