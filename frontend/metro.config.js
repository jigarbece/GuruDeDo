const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Put NativeWind's compiled CSS OUTSIDE node_modules/.cache/ — Expo CLI clears
// the whole .cache/ directory during `expo export`, which wipes NativeWind's
// output along with it (Vercel build fails with "Unable to resolve module
// .../.cache/nativewind/global.css" even though tailwind reported "rebuilding... done").
const outputDir = "node_modules/.nativewind";

const options = { input: "./global.css", outputDir };

// On Windows, NativeWind spawns the Tailwind CLI via `cliCommand.split(" ")`,
// which breaks when the project path contains spaces (e.g. "Guru De Do").
// Quote the resolved CLI path so the shell keeps it as a single argument.
// On Linux (Vercel) the default works — don't override.
if (process.platform === "win32") {
  const tailwindPkg = require.resolve("tailwindcss/package.json");
  const tailwindBin = path.join(path.dirname(tailwindPkg), require(tailwindPkg).bin.tailwindcss);
  options.cliCommand = `node "${tailwindBin}"`;
}

module.exports = withNativeWind(config, options);
