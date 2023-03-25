"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield (0, utils_1.getFilesFromJsFolder)();
    let changedPackages = false;
    let finishedFiles = false;
    files.forEach((file, i) => __awaiter(void 0, void 0, void 0, function* () {
        const fileContent = yield (0, utils_1.getFileContent)(`./js/${file}`);
        const icons = (0, utils_1.substringRawIconsFromFileContent)(fileContent);
        const prefix = (0, utils_1.substringPrefixFromFileContent)(fileContent);
        const packageName = (0, utils_1.getPackageNameByPrefix)(prefix);
        const packageDir = (0, utils_1.getPackageDir)(prefix);
        const iconFiles = (0, utils_1.formatIconsIntoFiles)(icons, prefix);
        // Create package directory
        yield (0, utils_1.createPackageDirectory)(packageDir);
        const neededFiles = (0, utils_1.getNeededFiles)(iconFiles);
        const missingFiles = yield (0, utils_1.getMissingFiles)(packageDir, neededFiles);
        yield (0, utils_1.createAllFiles)({
            iconFiles,
            icons,
            missingFiles,
            packageDir,
            prefix,
        });
        // Log about updates
        if (missingFiles.length > 0) {
            changedPackages = true;
            if (missingFiles.length < neededFiles.length) {
                console.log(`Updated ${packageName} package by ${missingFiles.length} files`);
            }
            else {
                console.log(`Created ${packageName} package`);
            }
        }
        // If this is the last file, set finishedFiles to true
        i === files.length - 1 && (finishedFiles = true);
    }));
    // Wait for all files to be finished
    while (!finishedFiles) {
        yield new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Log if all packages are up to date
    !changedPackages && console.log('All packages are up to date');
}))();
