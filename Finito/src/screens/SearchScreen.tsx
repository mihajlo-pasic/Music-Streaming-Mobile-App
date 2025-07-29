// src/screens/SearchScreen.tsx
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ViewToken,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import axios from "axios";
import { JELLYFIN_URL } from "@env";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";
import { stop } from "../utils/AudioManager";

type SearchNavProp = StackNavigationProp<RootStackParamList, "Player">;

type Item = {
  id: string;
  name: string;
  imageUrl: string;
  artistName?: string;
};
type Section = { title: string; data: Item[] };

const categories = ["Songs", "Albums", "Artists", "Playlists"] as const;
type Category = (typeof categories)[number];

const ITEM_HEIGHT = 60;

const SongRow = memo(({ item }: { item: Item }) => (
  <View style={styles.itemRow}>
    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
    <Text style={styles.itemText} numberOfLines={1}>
      {item.name}
    </Text>
  </View>
));

export default function SearchScreen({ route }: any) {
  const navigation = useNavigation<SearchNavProp>();
  const token = route.params?.token;
  const userId = route.params?.userId;
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<Category>("Songs");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState("A");

  const sectionListRef = useRef<SectionList>(null);

  // Scroll → highlight
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const sec = (viewableItems[0].section as Section).title;
        setActiveLetter(sec);
      }
    }
  ).current;

  // Klik na sidebar → scrollToLocation
  const onPressLetter = useCallback(
    (letter: string) => {
      const idx = sections.findIndex((sec) => sec.title === letter);
      if (idx >= 0) {
        setActiveLetter(letter);
        sectionListRef.current?.scrollToLocation({
          sectionIndex: idx,
          itemIndex: 0,
          viewPosition: 0,
        });
      }
    },
    [sections]
  );

  // Generičko punjenje
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const url = `${JELLYFIN_URL}/Users/${userId}/Items`;
        const params: any = {
          Recursive: true,
          SortBy: "Name",
          SortOrder: "Ascending",
          Limit: 1000,
        };
        switch (category) {
          case "Songs":
            params.IncludeItemTypes = "Audio";
            break;
          case "Albums":
            params.IncludeItemTypes = "MusicAlbum";
            break;
          case "Artists":
            params.IncludeItemTypes = "MusicArtist";
            break;
          case "Playlists":
            params.IncludeItemTypes = "Playlist";
            break;
        }
        const res = await axios.get(url, {
          headers: { "X-Emby-Token": token },
          params,
        });
        const items: Item[] = res.data.Items.map((it: any) => ({
          id: it.Id,
          name: it.Name,
          imageUrl:
            category === "Artists"
              ? `${JELLYFIN_URL}/Artists/${it.Id}/Images/Primary?maxHeight=80&tag=Primary&quality=90&api_key=${token}`
              : `${JELLYFIN_URL}/Items/${it.Id}/Images/Primary?maxHeight=80&tag=Primary&quality=90&api_key=${token}`,
          artistName:
            category === "Albums"
              ? it.AlbumArtist || it.ArtistItems?.[0]?.Name
              : undefined,
        }));

        setAllItems(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, userId, token]);

  // A–Z sekcije + #
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? allItems.filter((it) => it.name.toLowerCase().startsWith(term))
      : allItems;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const letterSecs: Section[] = letters
      .map((L) => ({
        title: L,
        data: filtered.filter((it) => it.name[0]?.toUpperCase() === L),
      }))
      .filter((sec) => sec.data.length > 0);

    const others = filtered.filter((it) => {
      const first = it.name[0]?.toUpperCase();
      return !letters.includes(first);
    });
    if (others.length) letterSecs.push({ title: "#", data: others });

    setSections(letterSecs);
    if (letterSecs.length) setActiveLetter(letterSecs[0].title);
  }, [allItems, searchTerm]);

  if (loading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={[styles.searchInput, { marginTop: insets.top + 8 }]}
        placeholder={`Search ${category.toLowerCase()}...`}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              cat === category && styles.categoryPillActive,
            ]}
            onPress={() => {
              setCategory(cat);
              setSearchTerm("");
            }}
          >
            <Text
              style={[
                styles.categoryText,
                cat === category && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) =>
            category === "Albums" ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AlbumDetail", {
                    albumId: item.id,
                    albumName: item.name,
                    artistName: item.artistName || "",
                    token,
                    userId: route.params.userId,
                  })
                }
                style={styles.itemRow}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />
                <Text style={styles.itemText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ) : category === "Artists" ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ArtistDetail", {
                    artistId: item.id,
                    artistName: item.name,
                    token,
                    userId: route.params.userId,
                  })
                }
                style={styles.itemRow}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />
                <Text style={styles.itemText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ) : category === "Playlists" ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("PlaylistDetail", {
                    playlistId: item.id,
                    playlistName: item.name,
                    token,
                    userId: route.params.userId,
                  })
                }
                style={styles.itemRow}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />
                <Text style={styles.itemText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  stop();
                  navigation.navigate("Player", {
                    itemId: item.id,
                    name: item.name,
                    imageUrl: item.imageUrl,
                    token,
                    userId: route.params.userId,
                    queue: allItems,
                    index: allItems.findIndex((x) => x.id === item.id),
                  });
                }}
              >
                <SongRow item={item} />
              </TouchableOpacity>
            )
          }
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews
          onScrollToIndexFailed={() => {}}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
        <View style={styles.alphaBar}>
          {sections.map((sec) => (
            <TouchableOpacity
              key={sec.title}
              onPress={() => onPressLetter(sec.title)}
            >
              <Text
                style={[
                  styles.alphaLetter,
                  sec.title === activeLetter && styles.alphaLetterActive,
                ]}
              >
                {sec.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchInput: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#333",
  },
  categoryPillActive: {
    backgroundColor: "#1DB954",
  },
  categoryText: { color: "#aaa" },
  categoryTextActive: { color: "#fff", fontWeight: "600" },

  listContainer: { flex: 1, flexDirection: "row" },
  sectionHeader: {
    backgroundColor: "#121212",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: "bold",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 10,
  },
  itemText: { color: "#fff", fontSize: 14 },

  alphaBar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  alphaLetter: {
    color: "#888",
    fontSize: 12,
    paddingVertical: 2,
  },
  alphaLetterActive: {
    color: "#1DB954",
    fontWeight: "bold",
  },
});
