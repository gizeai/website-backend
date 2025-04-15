import * as fs from "fs";

if (!fs.existsSync("./__cache__")) {
  fs.mkdirSync("./__cache__", {
    recursive: true,
  });
}

if (!fs.existsSync("./__cache__/app.log")) {
  fs.writeFileSync("./__cache__/app.log", "");
}

if (!fs.existsSync("./__cache__/quotes.json")) {
  fs.writeFileSync("./__cache__/quotes.json", "{}");
}

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}
