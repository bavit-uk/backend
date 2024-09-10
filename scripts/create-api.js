const fs = require("fs");
const path = require("path");

let componentName = process.argv[3];
let createSpecificFiles = process.argv[2];

console.log("Component Name: ", componentName);
console.log("Create Specific Files: ", createSpecificFiles);

if (!["model", "controller", "service", "route", "contract"].includes(createSpecificFiles)) {
  if (!componentName) {
    componentName = createSpecificFiles;
    createSpecificFiles = null;
  } else {
    console.log("Please provide a valid file name to create");
    process.exit(1);
  }
}

// convert componentName to kebab-case
componentName = componentName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

const modelPath = path.join(__dirname, "..", "src", "models", `${componentName}.model.ts`);
const controllerPath = path.join(__dirname, "..", "src", "controllers", `${componentName}.controller.ts`);
const servicePath = path.join(__dirname, "..", "src", "services", `${componentName}.service.ts`);
const routePath = path.join(__dirname, "..", "src", "routes", `${componentName}.route.ts`);
const contractPath = path.join(__dirname, "..", "src", "contracts", `${componentName}.contract.ts`);

if (!createSpecificFiles || createSpecificFiles === "model") {
  if (!fs.existsSync(modelPath)) {
    fs.writeFileSync(modelPath, "");
  } else {
    console.log("model file already exists, skipping...");
  }
}

if (!createSpecificFiles || createSpecificFiles === "controller") {
  if (!fs.existsSync(controllerPath)) {
    fs.writeFileSync(controllerPath, "");
  } else {
    console.log("controller file already exists, skipping...");
  }
}

if (!createSpecificFiles || createSpecificFiles === "service") {
  if (!fs.existsSync(servicePath)) {
    fs.writeFileSync(servicePath, "");
  } else {
    console.log("service file already exists, skipping...");
  }
}

if (!createSpecificFiles || createSpecificFiles === "route") {
  if (!fs.existsSync(routePath)) {
    fs.writeFileSync(routePath, "");
  } else {
    console.log("route file already exists, skipping...");
  }
}

if (!createSpecificFiles || createSpecificFiles === "contract") {
  if (!fs.existsSync(contractPath)) {
    fs.writeFileSync(contractPath, "");
  } else {
    console.log("contract file already exists, skipping...");
  }
}

console.log("Component created successfully");
