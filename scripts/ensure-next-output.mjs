import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const nextDir = path.join(rootDir, ".next");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function removeNextDir(reason) {
  console.warn(`[next-preflight] ${reason}. Removing stale .next output.`);
  fs.rmSync(nextDir, { recursive: true, force: true });
}

function collectManifestFiles(manifest) {
  const files = new Set();

  const pushValues = (value) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string") {
          files.add(entry);
        }
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(pushValues);
    }
  };

  pushValues(manifest);
  return files;
}

function validateManifestFiles(manifestPath) {
  const manifest = readJson(manifestPath);
  const manifestFiles = collectManifestFiles(manifest);

  for (const relativeFile of manifestFiles) {
    if (!relativeFile.startsWith("static/")) {
      continue;
    }

    const absoluteFile = path.join(nextDir, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      return `Manifest ${path.basename(manifestPath)} references missing file ${relativeFile}`;
    }
  }

  return null;
}

function validateServerChunkReferences(serverDir) {
  const pending = [serverDir];
  const requirePattern = /require\((['"])(\.[^'"]+\.js)\1\)/g;

  while (pending.length > 0) {
    const currentDir = pending.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".js")) {
        continue;
      }

      const source = fs.readFileSync(absolutePath, "utf8");
      let match;

      while ((match = requirePattern.exec(source)) !== null) {
        const targetPath = path.resolve(path.dirname(absolutePath), match[2]);
        if (!fs.existsSync(targetPath)) {
          return `Server chunk ${path.relative(rootDir, absolutePath)} references missing module ${match[2]}`;
        }
      }
    }
  }

  return null;
}

function main() {
  if (!fs.existsSync(nextDir)) {
    return;
  }

  const requiredFiles = [
    path.join(nextDir, "build-manifest.json"),
    path.join(nextDir, "app-build-manifest.json"),
    path.join(nextDir, "routes-manifest.json"),
    path.join(nextDir, "required-server-files.json"),
    path.join(nextDir, "BUILD_ID"),
    path.join(nextDir, "static"),
    path.join(nextDir, "server"),
  ];

  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      removeNextDir(`Missing required Next output ${path.relative(rootDir, filePath)}`);
      return;
    }
  }

  const manifestFiles = [
    path.join(nextDir, "build-manifest.json"),
    path.join(nextDir, "app-build-manifest.json"),
  ];

  for (const manifestPath of manifestFiles) {
    try {
      const error = validateManifestFiles(manifestPath);
      if (error) {
        removeNextDir(error);
        return;
      }
    } catch (error) {
      removeNextDir(`Unreadable manifest ${path.basename(manifestPath)} (${error.message})`);
      return;
    }
  }

  try {
    const serverError = validateServerChunkReferences(path.join(nextDir, "server"));
    if (serverError) {
      removeNextDir(serverError);
    }
  } catch (error) {
    removeNextDir(`Failed to validate server chunk references (${error.message})`);
  }
}

main();
