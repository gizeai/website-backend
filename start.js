/* eslint-disable @typescript-eslint/no-require-imports */

const tsConfigPaths = require("tsconfig-paths");
const path = require("path");

const baseUrl = path.resolve(__dirname, path.join("dist", "src"));
const config = require("./tsconfig.json");

tsConfigPaths.register({
  baseUrl,
  paths: config.compilerOptions.paths,
});

require("./dist/src/server.js");
