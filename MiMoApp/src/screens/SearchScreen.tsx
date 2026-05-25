import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineIcon } from '../components/shared/LineIcon';
import { useSemanticSearch } from '../hooks/useSemanticSearch';
import { useSettingsStore } from '../store/settingsStore';
import type { RootStackScreenProps } from '../navigation/types';

const SUGGESTIONS = ['人物', '风景', '美食', '宠物', '截图', '文档', '旅行', '日落'];

export function SearchScreen({ navigation }: RootStackScreenProps<'Search'>) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const searchHistory = useSettingsStore((s) => s.searchHistory);
  const clearSearchHistory = useSettingsStore((s) => s.clearSearchHistory);
  const { suggest } = useSemanticSearch();

  const suggestions = useMemo(() => {
    if (query.trim().length === 0) return [];
    return suggest(query);
  }, [query, suggest]);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      navigation.replace('SearchResults', { query: trimmed });
    }
  }, [query, navigation]);

  const handleSuggestion = useCallback((text: string) => {
    navigation.replace('SearchResults', { query: text });
  }, [navigation]);

  const showHistory = query.trim().length === 0 && searchHistory.length > 0;
  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;
  const showDefault = !showHistory && !showSuggestions;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <LineIcon name="chevron-left" size={24} color="#2C3E35" />
        </Pressable>
        <View style={s.searchBar}>
          <LineIcon name="search" size={18} color="#8A9E92" />
          <TextInput
            ref={inputRef}
            style={s.input}
            value={query}
            onChangeText={setQuery}
            placeholder="搜索照片、地点、日期…"
            placeholderTextColor="#8A9E92"
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <LineIcon name="close" size={16} color="#8A9E92" />
            </Pressable>
          )}
        </View>
      </View>

      {showHistory && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>最近搜索</Text>
            <Pressable onPress={clearSearchHistory}>
              <Text style={s.clearText}>清除</Text>
            </Pressable>
          </View>
          <View style={s.chips}>
            {searchHistory.slice(0, 10).map((text) => (
              <Pressable key={text} style={s.chip} onPress={() => handleSuggestion(text)}>
                <Text style={s.chipText}>{text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {showSuggestions && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>搜索建议</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable style={s.suggestRow} onPress={() => handleSuggestion(item)}>
                <LineIcon name="search" size={16} color="#8A9E92" />
                <Text style={s.suggestText}>{item}</Text>
              </Pressable>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {showDefault && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>猜你想搜</Text>
          <View style={s.chips}>
            {SUGGESTIONS.map((text) => (
              <Pressable key={text} style={s.chip} onPress={() => handleSuggestion(text)}>
                <Text style={s.chipText}>{text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F3' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F3',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E35',
    paddingVertical: 0,
  },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#2C3E35', marginBottom: 12 },
  clearText: { fontSize: 13, color: '#8A9E92' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F4F6F3',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: '#2C3E35' },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECE6',
  },
  suggestText: { fontSize: 15, color: '#2C3E35' },
});
