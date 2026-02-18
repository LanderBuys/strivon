const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add workspace root to watchFolders for monorepo support
config.watchFolders = Array.from(new Set([...(config.watchFolders || []), workspaceRoot]));

// On Windows, Expo may create/delete temporary `.expo-*` folders under `node_modules`.
// Metro's watcher can crash if it tries to watch a folder that gets deleted mid-scan.
// Exclude these transient folders from Metro's file map to prevent ENOENT watch crashes.
config.resolver.blockList = /node_modules[\\/]\.expo-[^\\/]+[\\/].*/;

// Configure resolver to look in both local and workspace root node_modules
// This ensures TurboModules and native modules are resolved correctly
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure proper source extensions
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs', 'cjs'];

// Enable package exports for better module resolution
config.resolver.unstable_enablePackageExports = true;

// Disable symlinks resolution issues in workspaces
config.resolver.unstable_conditionNames = ['require', 'react-native', 'default'];

module.exports = config;


