import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useMd3Theme } from '../../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const theme = useMd3Theme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.icon]}>😔</Text>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          抱歉，出现了一些问题
        </Text>
        <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          应用遇到了一些错误，但不用担心，我们可以帮您解决。
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
              错误详情
            </Text>
            <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {error.name}: {error.message}
            </Text>
            {errorInfo?.componentStack && (
              <Text style={[styles.stackText, { color: theme.colors.onErrorContainer }]}>
                {errorInfo.componentStack}
              </Text>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={onReset}
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
              重试
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              // Could navigate to home or contact support
            }}
            style={[styles.secondaryButton, { borderColor: theme.colors.outline }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              联系支持
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
