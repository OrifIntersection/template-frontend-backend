#!/usr/bin/env node
import fs from "fs";
import { createInterface } from "readline/promises";
import { execSync } from "child_process";

function isValidProjectName(name) {
  if (!name || typeof name !== "string") return false;

  const trimmed = name.trim();
  if (trimmed.length === 0) return false;

  // Check for path traversal or absolute paths
  if (
    trimmed.includes("..") ||
    trimmed.startsWith("/") ||
    trimmed.includes(":")
  ) {
    return false;
  }

  // NPM Package Name Regex
  // Based on npm's rules: lowercase, alphanumeric, -, _, ., no spaces
  // Must not start with . or _
  // Max length 214 chars
  const npmRegex = /^(?!.*\.\.)(?!^\.|_)[a-z0-9._-]+$/;

  if (!npmRegex.test(trimmed)) {
    return false;
  }

  return true;
}

const backJs = `import express from "express";
const app = express();
app.get('/', (req, res) => {
    res.send('Hello World')
});
app.listen(3000, () => console.log('App listening on port 3000'));
`;

const backDependencies = ["express"];
const backDevDependencies = ["nodemon"];
const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log(`🚀 Creating a new project...`);

let projectName;
let projectDesc;

try {
  projectName = await rl.question("Project Name: ");
  if (!isValidProjectName(projectName)) throw new Error();

  projectDesc = await rl.question("Project Description: ");
} catch (error) {
  console.error("Invalid project name.");
  console.error(
    "   - Must be lowercase, alphanumeric, hyphens, underscores, or dots.",
  );
  console.error("   - Cannot start with a dot or underscore.");
  console.error("   - Cannot contain spaces or path separators.");
  process.exit(1);
}

rl.close();

console.log(`Creating project: ${projectName}`);

// Scaffold files
const backPackageJson = {
  name: `${projectName}-backend`,
  version: "1.0.0",
  description: projectDesc,
  author: "ORIF Pomy Intersection",
  type: "module",
  main: "server.js",
  scripts: {
    serve: "nodemon server.js",
  },
};

// Setup backend template
fs.writeFileSync(
  "backend/package.json",
  JSON.stringify(backPackageJson, null, 2),
);
fs.writeFileSync("backend/server.js", backJs);

fs.writeFileSync("README.md", `Documentation pour ${projectName}`);

try {
  if (backDependencies.length > 0)
    execSync(`npm install ${backDependencies.join(" ")}`, {
      stdio: "inherit",
      cwd: "backend",
    });
  if (backDevDependencies.length > 0)
    execSync(`npm install ${backDevDependencies.join(" ")} --save-dev`, {
      stdio: "inherit",
      cwd: "backend",
    });

  execSync(`npm create vite@latest frontend -- --template react`);
  execSync(`npm install`, {
    stdio: "inherit",
    cwd: "frontend",
  });
  console.log(`✅ Dependencies installed successfully.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

fs.rmSync("package.json");
fs.rmSync("create.js");
console.log(`✅ Project created successfully.`);
