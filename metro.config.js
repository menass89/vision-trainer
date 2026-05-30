// Metro config — extends Expo defaults, excludes the legacy web source
// (kept in _legacy/ only as a porting reference for the native rewrite).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [/(^|[\\/])_legacy[\\/].*/];

module.exports = config;
