# Font Awesome's SVG with JS packages creator

## ATTENTION: This script is not affiliated with `Font Awesome` in any way. It is just a helper script to create a custom fontawesome packages. You can find free packages on on github or npm `@fortawesome`. To create pro packages with this script you need to have a valid fontawesome pro license. You can get one [here](https://fontawesome.com/plans)

## Description

This is a simple script to create a custom Font Awesome's SVG with JS packages like `@fortawesome/free-brands-svg-icons`.

## Usage

Place your js folder from fontawesome pro in the same folder as this script.

Script will create the packages in the `packages` folder. You can then copy the packages to your project. Script is done that it prefers minified files with `.min.js` extension, if there is no minified file, the script will fallback to normal file.

## CAUTION: Please don't rename files in js folder because the script will ignore them! And also script is tested only with fontawesome pro version 6.3.0, so if you have a different version and it doesn't work, please open an issue
