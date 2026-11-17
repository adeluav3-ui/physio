import { copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../../../packages/exercise-animation/rehab360-anim/data");
const dst = join(__dirname, "../public/exercise-data");

mkdirSync(dst, { recursive: true });
copyFileSync(join(src, "poses.json"), join(dst, "poses.json"));
copyFileSync(join(src, "joint-map.json"), join(dst, "joint-map.json"));
console.log("exercise-data copied to public/");
