import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useMd3Theme } from '../../theme';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  items: ContextMenuItem[];
  title?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ContextMenu({ visible, items, title, onSelect, onClose }: ContextMenuProps) {
  const theme = useMd3Theme();

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.menu, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
          {title && (
            <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>{title}</Text>
          )}
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.item, item.disabled && styles.itemDisabled]}
              onPress={() => !item.disabled && handleSelect(item.id)}
            >
              {item.icon && <Text style={styles.itemIcon}>{item.icon}</Text>}
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: item.destructive
                      ? theme.colors.error
                      : item.disabled
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onSurface,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000055',
    padding: 32,
  },
  menu: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemDisabled: { opacity: 0.5 },
  itemIcon: { fontSize: 18 },
  itemLabel: { fontSize: 15, fontWeight: '500' },
});
