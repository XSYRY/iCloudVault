import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useMd3Theme } from '../../theme';
import { usePhotoStore } from '../../store';
import { LineIcon } from '../shared/LineIcon';

interface SearchBarProps {
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onSubmit?: (query: string) => void;
}

export function SearchBar({ isActive, onFocus, onClose, onSubmit }: SearchBarProps) {
  const theme = useMd3Theme();
  const searchQuery = usePhotoStore((s) => s.filter.searchQuery);
  const setFilter = usePhotoStore((s) => s.setFilter);

  const iconColor = isActive ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchBar,
        {
          backgroundColor: isActive ? theme.colors.surfaceContainerHigh : theme.colors.background,
          borderWidth: isActive ? 1.5 : 0,
          borderColor: isActive ? theme.colors.primary : 'transparent',
        },
      ]}>
        <View style={styles.searchIconWrap}>
          <LineIcon
            name={isActive ? 'search-filled' : 'search'}
            size={18}
            color={iconColor}
          />
        </View>
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder="搜索照片、地点、标签..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onFocus={onFocus}
          onChangeText={(text) => setFilter({ searchQuery: text })}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (searchQuery.trim() && onSubmit) {
              onSubmit(searchQuery.trim());
            }
          }}
        />
        {searchQuery ? (
          <Pressable onPress={() => setFilter({ searchQuery: '' })} style={styles.clearBtn} hitSlop={8}>
            <View style={[styles.clearCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
              <LineIcon name="close" size={12} color={theme.colors.onSurfaceVariant} />
            </View>
          </Pressable>
        ) : null}
        {isActive && !searchQuery && (
          <Pressable onPress={onClose} style={styles.cancelBtn} hitSlop={8}>
            <LineIcon name="close" size={16} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  searchIconWrap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    padding: 4,
  },
});
