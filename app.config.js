const { execSync } = require('node:child_process');

function git(args, fallback) {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

module.exports = ({ config }) => {
  const gitSha = git('rev-parse --short HEAD', 'nogit');
  const buildNumber = git('rev-list --count HEAD', '1');

  return {
    ...config,
    ios: { ...config.ios, buildNumber: String(buildNumber) },
    android: { ...config.android, versionCode: Number(buildNumber) },
    extra: { ...(config.extra ?? {}), gitSha, buildNumber: String(buildNumber) },
  };
};
