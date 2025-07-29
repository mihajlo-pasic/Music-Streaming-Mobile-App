// src/screens/FavoritesScreen.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";
import { stop } from "../utils/AudioManager";

type FavRouteProp = RouteProp<RootStackParamList, "Favorites">;
type FavNavProp = StackNavigationProp<RootStackParamList, "Favorites">;

export default function FavoritesScreen({ route }: { route: FavRouteProp }) {
  const { favorites, token, userId } = route.params;
  const navigation = useNavigation<FavNavProp>();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              stop();
              navigation.navigate("Player", {
                // ID i osnovni podaci odabrane pjesme:
                itemId: item.id,
                name: item.title,
                imageUrl: item.imageUrl,
                // tvoj token i userId
                token,
                userId,
                // cijeli queue, mapiran da ima polje "name" umjesto "title"
                queue: favorites.map((f) => ({
                  id: f.id,
                  name: f.title,
                  imageUrl: f.imageUrl,
                })),
                index,
              });
            }}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.img} />
            <Text style={styles.txt} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No favorite songs yet.</Text>
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
    padding: 12,
    borderBottomColor: "#333",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  img: { width: 50, height: 50, borderRadius: 4, marginRight: 12 },
  txt: { color: "#fff", fontSize: 16, flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { color: "#888", fontSize: 16 },
});
