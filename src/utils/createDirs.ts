import * as fs from "fs";

if (!fs.existsSync("./logs")) {
  fs.mkdirSync("./logs", {
    recursive: true,
  });
}

if (!fs.existsSync("./logs/app.log")) {
  fs.writeFileSync("./logs/app.log", "");
}

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}
