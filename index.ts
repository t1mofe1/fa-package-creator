import {
  createAllFiles,
  createPackageDirectory,
  formatIconsIntoFiles,
  getFileContent,
  getFilesFromJsFolder,
  getMissingFiles,
  getNeededFiles,
  getPackageDir,
  getPackageNameByPrefix,
  substringPrefixFromFileContent,
  substringRawIconsFromFileContent,
} from './utils';

(async () => {
  const files = await getFilesFromJsFolder();

  let changedPackages = false;
  let finishedFiles = false;

  files.forEach(async (file, i) => {
    const fileContent = await getFileContent(`./js/${file}`);

    const icons = substringRawIconsFromFileContent(fileContent);
    const prefix = substringPrefixFromFileContent(fileContent);

    const packageName = getPackageNameByPrefix(prefix);
    const packageDir = getPackageDir(prefix);

    const iconFiles = formatIconsIntoFiles(icons, prefix);

    // Create package directory
    await createPackageDirectory(packageDir);

    const neededFiles = getNeededFiles(iconFiles);
    const missingFiles = await getMissingFiles(packageDir, neededFiles);

    await createAllFiles({
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
        console.log(
          `Updated ${packageName} package by ${missingFiles.length} files`,
        );
      } else {
        console.log(`Created ${packageName} package`);
      }
    }

    // If this is the last file, set finishedFiles to true
    i === files.length - 1 && (finishedFiles = true);
  });

  // Wait for all files to be finished
  while (!finishedFiles) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Log if all packages are up to date
  !changedPackages && console.log('All packages are up to date');
})();
