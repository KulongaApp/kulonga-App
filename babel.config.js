module.exports = function (api) {
  api.cache(true);
  const presets = ['babel-preset-expo'];
  const plugins = [];

  try {
    const nativewind = require('nativewind/babel');
    let isPreset = false;

    // If it's a function, try calling it to inspect the returned shape (many presets export a function)
    if (typeof nativewind === 'function') {
      try {
        const maybePreset = nativewind();
        if (maybePreset && (maybePreset.presets || maybePreset.plugins)) {
          isPreset = true;
        }
      } catch (e) {
        // ignore invocation errors and fall back to treating exports conservatively
      }
    }

    // If the export is an object or a function that looks like a preset, add the required value to presets
    if (isPreset || (nativewind && typeof nativewind === 'object' && (nativewind.presets || nativewind.plugins))) {
      presets.push(nativewind);
    } else {
      // Otherwise treat as a plugin
      plugins.push(nativewind);
    }
  } catch (e) {
    // If require fails (module not installed yet), fallback to string plugin for Metro to resolve
    plugins.push('nativewind/babel');
  }

  return {
    presets,
    plugins,
  };
};