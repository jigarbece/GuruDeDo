const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// NativeWind spawns the Tailwind CLI via `cliCommand.split(" ")`, which breaks when
// the project path contains spaces (e.g. "Guru De Do"). Quote the resolved CLI path
// so the shell keeps it as a single argument.
const tailwindPkg = require.resolve("tailwindcss/package.json");
const tailwindBin = path.join(path.dirname(tailwindPkg), require(tailwindPkg).bin.tailwindcss);

module.exports = withNativeWind(config, {
  input: "./global.css",
  cliCommand: `node "${tailwindBin}"`,
});
