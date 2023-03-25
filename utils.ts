import * as fs from 'graceful-fs';
import { promisify } from 'util';

export function formatIconName(iconName: string) {
  return iconName
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
}

type IconDefinition = [number, number, (string | number)[], string, string]; // [width, height, aliases, unicode, path]

const mkDir = promisify(fs.mkdir);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export async function getFileContent(path: string) {
  const content = await readFile(path)
    .then((buffer) => buffer.toString())
    .catch(noFunc);

  return content || '';
}

export function createPackageDirectory(packageDir: string) {
  return mkDir(packageDir, { recursive: true }).then(noFunc).catch(noFunc);
}

export function formatIconsIntoFiles(
  icons: Record<string, IconDefinition>,
  prefix: IconPrefix,
) {
  return Object.entries(icons).map(
    ([iconName, [width, height, aliases, unicode, path]]) =>
      formatIconInfoAsFiles({
        prefix,
        iconName,
        width,
        height,
        aliases,
        unicode,
        path,
      }),
  );
}

export function getPackageNameByPrefix(prefix: IconPrefix) {
  return prefixPackageMap[prefix];
}

export function getPackageDir(prefix: IconPrefix) {
  return `./packages/@fortawesome/${prefixPackageMap[prefix]}`;
}

export async function getFilesFromJsFolder() {
  const files = await readDir('./js')
    .then((files) =>
      files
        .filter((file) => !!filePackageMap[file as keyof typeof filePackageMap])
        .filter(
          (file) =>
            file.endsWith(`.min.js`) ||
            !files.includes(file.replace(`.js`, `.min.js`)),
        ),
    )
    .catch(noFunc);

  return files || [];
}

export async function getMissingFiles(
  packageDir: string,
  neededFiles: string[],
) {
  const files = await readDir(packageDir)
    .then((files) => neededFiles.filter((file) => !files.includes(file)))
    .catch(noFunc);

  return files || [];
}
export function getNeededFiles(iconFiles: IconFile[]) {
  return [
    'index.d.ts',
    'index.js',
    'index.mjs',
    'package.json',
    'attribution.js',
    'README.md',
    'LICENSE.txt',

    ...iconFiles
      .map(({ formattedName, aliasFiles }) => [
        `fa${formattedName}.d.ts`,
        `fa${formattedName}.js`,

        ...aliasFiles
          .map(({ formattedName: aliasFormattedName }) => [
            `fa${aliasFormattedName}.js`,
            `fa${aliasFormattedName}.d.ts`,
          ])
          .flat(),
      ])
      .flat(),
  ];
}

const fileCreateMap = {
  'index.js': generateIndexJsFile,
  'index.mjs': generateIndexMjsFile,
  'index.d.ts': generateIndexTypeFile,
  'attribution.js': generateAttributionFile,
  'package.json': generatePackageJsonFile,
  'README.md': generateReadmeMdFile,
  'LICENSE.txt': generateLicenseTxtFile,
};
type AllDataProps = {
  icons: Record<string, IconDefinition>;
  prefix: IconPrefix;
  iconFiles: IconFile[];
  missingFiles: string[];
  packageDir: string;
};
function createFileIfFileMissing(
  allData: AllDataProps,
  file: keyof typeof fileCreateMap,
) {
  if (allData.missingFiles.includes(file)) {
    return writeFile(
      `${allData.packageDir}/${file}`,
      fileCreateMap[file](allData),
    ).catch(noFunc);
  }

  return Promise.resolve();
}

function createIconFiles({
  iconFiles,
  missingFiles,
  packageDir,
}: AllDataProps) {
  return iconFiles.map((iconFile) => {
    const { typesFileContent, jsFileContent, formattedName, aliasFiles } =
      iconFile;

    const createFiles = (
      name: string,
      typesFileContent: string,
      jsFileContent: string,
    ) => [
      missingFiles.includes(`fa${name}.d.ts`) &&
        writeFile(`${packageDir}/fa${name}.d.ts`, typesFileContent).catch(
          noFunc,
        ),
      missingFiles.includes(`fa${name}.js`) &&
        writeFile(`${packageDir}/fa${name}.js`, jsFileContent).catch(noFunc),
    ];

    return [
      ...createFiles(formattedName, typesFileContent, jsFileContent),
      ...aliasFiles
        .map(({ formattedName, jsFileContent, typesFileContent }) =>
          createFiles(formattedName, typesFileContent, jsFileContent),
        )
        .flat(),
    ];
  });
}

export function createAllFiles(allData: AllDataProps) {
  return Promise.all([
    createIconFiles(allData),
    ...Object.keys(fileCreateMap).map((file) =>
      createFileIfFileMissing(allData, file as keyof typeof fileCreateMap),
    ),
  ]);
}

const noFunc = () => {};

const prefixPackageMap = {
  fab: 'free-brands-svg-icons',
  fad: 'pro-duotone-svg-icons',
  fal: 'pro-light-svg-icons',
  far: 'pro-regular-svg-icons',
  fas: 'pro-solid-svg-icons',
  fat: 'pro-thin-svg-icons',
  fasr: 'sharp-regular-svg-icons',
  fass: 'sharp-solid-svg-icons',
};
const filePackageMap = {
  'brands.js': prefixPackageMap.fab,
  'brands.min.js': prefixPackageMap.fab,
  'duotone.js': prefixPackageMap.fad,
  'duotone.min.js': prefixPackageMap.fad,
  'light.js': prefixPackageMap.fal,
  'light.min.js': prefixPackageMap.fal,
  'regular.js': prefixPackageMap.far,
  'regular.min.js': prefixPackageMap.far,
  'solid.js': prefixPackageMap.fas,
  'solid.min.js': prefixPackageMap.fas,
  'thin.js': prefixPackageMap.fat,
  'thin.min.js': prefixPackageMap.fat,
  'sharp-regular.js': prefixPackageMap.fasr,
  'sharp-regular.min.js': prefixPackageMap.fasr,
  'sharp-solid.js': prefixPackageMap.fass,
  'sharp-solid.min.js': prefixPackageMap.fass,
};

type FormatIconInfoAsFilesProps = {
  prefix: string;
  iconName: string;

  width: number;
  height: number;
  aliases: (string | number)[];
  unicode: string;
  path: string;
};
export function formatIconInfoAsFiles(props: FormatIconInfoAsFilesProps) {
  const { prefix, iconName, width, height, aliases, unicode, path } = props;

  const formattedName = formatIconName(iconName);

  const typesFileContent = [
    `import { IconDefinition, IconPrefix, IconName } from "@fortawesome/fontawesome-common-types";`,
    `export const definition: IconDefinition;`,
    `export const fa${formattedName}: IconDefinition;`,
    `export const prefix: IconPrefix;`,
    `export const iconName: IconName;`,
    `export const width: number;`,
    `export const height: number;`,
    `export const ligatures: (string | number)[];`,
    `export const unicode: string;`,
    `export const svgPathData: string;`,
    `export const aliases: (string | number)[];`,
  ].join('\n');

  const jsFileContent = [
    `'use strict';`,
    `Object.defineProperty(exports, '__esModule', { value: true });`,
    `var prefix = '${prefix}';`,
    `var iconName = '${iconName}';`,
    `var width = ${width};`,
    `var height = ${height};`,
    `var aliases = ${JSON.stringify(aliases)};`,
    `var unicode = '${unicode}';`,
    `var svgPathData = '${path}';`,
    ``,
    `exports.definition = {`,
    `  prefix: prefix,`,
    `  iconName: iconName,`,
    `  icon: [width, height, aliases, unicode, svgPathData],`,
    `};`,
    ``,
    `exports.fa${formattedName} = exports.definition;`,
    `exports.prefix = prefix;`,
    `exports.iconName = iconName;`,
    `exports.width = width;`,
    `exports.height = height;`,
    `exports.ligatures = aliases;`,
    `exports.unicode = unicode;`,
    `exports.svgPathData = svgPathData;`,
    `exports.aliases = aliases;`,
  ].join('\n');

  const aliasFiles = aliases
    .filter((alias) => typeof alias === 'string')
    .map((alias) => {
      const formattedAlias = formatIconName(alias as string);

      const typesFileContent = [
        `import { IconDefinition, IconPrefix, IconName } from "@fortawesome/fontawesome-common-types";`,
        `export const definition: IconDefinition;`,
        `export const fa${formattedAlias}: IconDefinition;`,
        `export const prefix: IconPrefix;`,
        `export const iconName: IconName;`,
        `export const width: number;`,
        `export const height: number;`,
        `export const ligatures: (string | number)[];`,
        `export const unicode: string;`,
        `export const svgPathData: string;`,
        `export const aliases: (string | number)[];`,
      ].join('\n');

      const jsFileContent = [
        `'use strict';`,
        `Object.defineProperty(exports, "__esModule", { value: true });`,
        `var source = require('./fa${formattedName}');`,
        `exports.definition = {`,
        `  prefix: source.prefix,`,
        `  iconName: source.iconName,`,
        `  icon: [`,
        `    source.width,`,
        `    source.height,`,
        `    source.aliases,`,
        `    source.unicode,`,
        `    source.svgPathData,`,
        `  ],`,
        `};`,
        ``,
        `exports.fa${formattedAlias} = exports.definition;`,
        `exports.prefix = source.prefix;`,
        `exports.iconName = source.iconName;`,
        `exports.width = source.width;`,
        `exports.height = source.height;`,
        `exports.ligatures = source.aliases;`,
        `exports.unicode = source.unicode;`,
        `exports.svgPathData = source.svgPathData;`,
        `exports.aliases = source.aliases;`,
      ].join('\n');

      return {
        formattedName: formattedAlias,
        typesFileContent,
        jsFileContent,
      };
    });

  return {
    typesFileContent,
    jsFileContent,
    formattedName,
    aliasFiles,
  };
}

export function substringPrefixFromFileContent(fileContent: string) {
  const minified = fileContent.indexOf(`bunker(function`) === -1;

  const strIndex1 = minified
    ? fileContent.indexOf(`function(){u("`) + 14
    : fileContent.indexOf(`bunker(function`) + 15;
  const strIndex2 = minified
    ? strIndex1
    : fileContent.indexOf(`defineIcons('`, strIndex1) + 13;
  const strIndex3 = minified
    ? fileContent.indexOf(`",p)`, strIndex2)
    : fileContent.indexOf(`', icons);`, strIndex2);

  const prefix = fileContent.slice(strIndex2, strIndex3);

  return prefix as IconPrefix;
}
export function substringRawIconsFromFileContent(fileContent: string) {
  const getFirstIndex = () => {
    const strIndex1 = fileContent.indexOf(`var icons = `);
    const strIndex2 = fileContent.indexOf(`var p=`);

    return strIndex1 !== -1 ? strIndex1 + 12 : strIndex2 + 6;
  };

  const strIndex1 = getFirstIndex();
  const strIndex2 = fileContent.indexOf(`};`, strIndex1);

  const iconsString = fileContent.slice(strIndex1, strIndex2 + 1);

  const icons = eval(`(${iconsString})`);

  return icons as Record<string, IconDefinition>;
}

type IconPrefix = keyof typeof prefixPackageMap;

type AliasFile = {
  formattedName: string;
  typesFileContent: string;
  jsFileContent: string;
};
type IconFile = {
  typesFileContent: string;
  jsFileContent: string;
  formattedName: string;
  aliasFiles: AliasFile[];
};

function generateAttributionFile({}: AllDataProps) {
  return [
    'console.log(`Font Awesome Free 6.3.0 by @fontawesome - https://fontawesome.com',
    'License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)',
    'Copyright 2023 Fonticons, Inc.',
    '`)',
  ].join('\n');
}
function generateIndexTypeFile({ iconFiles, prefix }: AllDataProps) {
  return [
    ...iconFiles.map(
      (iconFile) => `export const fa${iconFile.formattedName}: IconDefinition;`,
    ),
    `import { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from "@fortawesome/fontawesome-common-types";`,
    `export { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from "@fortawesome/fontawesome-common-types";`,
    `export const prefix: IconPrefix;`,
    `export const ${prefix}: IconPack;`,
  ].join('\n');
}
function generateIndexMjsFile({ icons, prefix }: AllDataProps) {
  return [
    `var prefix = '${prefix}';`,
    ...Object.entries(icons)
      .map(([iconName, iconDefiniton], i) => {
        const [width, height, aliases, unicode, path] = iconDefiniton;

        const formattedName = formatIconName(iconName);

        return [
          `var fa${formattedName} = {`,
          `  prefix: '${prefix}',`,
          `  iconName: '${iconName}',`,
          `  icon: [${width}, ${height}, ${JSON.stringify(
            aliases,
          )}, '${unicode}', '${path}']`,
          `};`,
          ...aliases
            .filter((alias) => typeof alias === 'string')
            .map((alias) => {
              const formattedAlias = formatIconName(alias as string);

              return `var fa${formattedAlias} = fa${formattedName};`;
            }),
        ];
      })
      .flat(),
    `var icons = {`,
    ...Object.entries(icons)
      .map(([iconName, [, , aliases]]) => {
        const formattedName = formatIconName(iconName);

        return [
          `  fa${formattedName}: fa${formattedName},`,
          ...aliases
            .filter((alias) => typeof alias === 'string')
            .map((alias) => {
              const formattedAlias = formatIconName(alias as string);

              return `  fa${formattedAlias}: fa${formattedAlias},`;
            }),
        ];
      })
      .flat(),
    `};`,
    ``,
    `export { icons as ${prefix}, prefix, ${Object.entries(icons)
      .map(([iconName, [, , aliases]]) => [
        `fa${formatIconName(iconName)}`,
        ...aliases
          .filter((alias) => typeof alias === 'string')
          .map((alias) => `fa${formatIconName(alias as string)}`),
      ])
      .flat()
      .join(', ')} };`,
  ].join('\n');
}
function generateIndexJsFile({ icons, prefix }: AllDataProps) {
  return [
    `(function (global, factory) {`,
    `  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :`,
    `  typeof define === 'function' && define.amd ? define(['exports'], factory) :`,
    `  (factory((global['${prefixPackageMap[prefix]}'] = {})));`,
    `}(this, (function (exports) { 'use strict';`,
    ``,
    `  var prefix = '${prefix}';`,
    ...Object.entries(icons)
      .map(([iconName, iconDefiniton], i) => {
        const [width, height, aliases, unicode, path] = iconDefiniton;

        const formattedName = formatIconName(iconName);

        return [
          `  var fa${formattedName} = {`,
          `    prefix: '${prefix}',`,
          `    iconName: '${iconName}',`,
          `    icon: [${width}, ${height}, ${JSON.stringify(
            aliases,
          )}, '${unicode}', '${path}']`,
          `  };`,
          ...aliases
            .filter((alias) => typeof alias === 'string')
            .map((alias) => {
              const formattedAlias = formatIconName(alias as string);

              return `  var fa${formattedAlias} = fa${formattedName};`;
            }),
        ];
      })
      .flat(),
    `  var icons = {`,
    ...Object.entries(icons)
      .map(([iconName, [, , aliases]]) => {
        const formattedName = formatIconName(iconName);

        return [
          `    fa${formattedName}: fa${formattedName},`,
          ...aliases
            .filter((alias) => typeof alias === 'string')
            .map((alias) => {
              const formattedAlias = formatIconName(alias as string);

              return `    fa${formattedAlias}: fa${formattedAlias},`;
            }),
        ];
      })
      .flat(),
    `  };`,
    ``,
    `  exports.${prefix} = icons;`,
    `  exports.prefix = prefix;`,
    ...Object.entries(icons)
      .map(([iconName, [, , aliases]]) => {
        const formattedName = formatIconName(iconName);

        return [
          `  exports.fa${formattedName} = fa${formattedName};`,
          ...aliases
            .filter((alias) => typeof alias === 'string')
            .map((alias) => {
              const formattedAlias = formatIconName(alias as string);

              return `  exports.fa${formattedAlias} = fa${formattedAlias};`;
            }),
        ];
      })
      .flat(),
    ``,
    `  Object.defineProperty(exports, '__esModule', { value: true });`,
    ``,
    `})));`,
  ].join('\n');
}
function generatePackageJsonFile({ prefix }: AllDataProps) {
  return JSON.stringify(
    {
      description: 'The iconic font, CSS, and SVG framework',
      keywords: ['font', 'awesome', 'fontawesome', 'icon', 'svg', 'bootstrap'],
      homepage: 'https://fontawesome.com',
      bugs: {
        url: 'https://github.com/FortAwesome/Font-Awesome/issues',
      },
      author:
        'The Font Awesome Team (https://github.com/orgs/FortAwesome/people)',
      repository: {
        type: 'git',
        url: 'https://github.com/FortAwesome/Font-Awesome',
      },
      engines: {
        node: '>=6',
      },
      dependencies: {
        '@fortawesome/fontawesome-common-types': '6.3.0',
      },
      version: '6.3.0',
      name: `@fortawesome/${prefixPackageMap[prefix]}`,
      main: 'index.js',
      module: 'index.mjs',
      'jsnext:main': 'index.mjs',
      license: '(CC-BY-4.0 AND MIT)',
      types: './index.d.ts',
      sideEffects: false,
      exports: {
        '.': {
          import: './index.mjs',
          require: './index.js',
          default: './index.js',
        },
        './index': {
          import: './index.mjs',
          require: './index.js',
          default: './index.js',
        },
        './index.js': {
          import: './index.mjs',
          require: './index.js',
          default: './index.js',
        },
        './package.json': './package.json',
        './*': './*.js',
      },
      scripts: {
        postinstall: 'node attribution.js',
      },
    },
    null,
    2,
  );
}
function generateReadmeMdFile({ prefix }: AllDataProps) {
  return [
    `# @fortawesome/${prefixPackageMap[prefix]} - SVG with JavaScript version`,
    ``,
    `> "I came here to chew bubblegum and install Font Awesome 6 - and I'm all out of bubblegum"`,
    ``,
    `[![npm](https://img.shields.io/npm/v/@fortawesome/${prefixPackageMap[prefix]}.svg?style=flat-square)](https://www.npmjs.com/package/@fortawesome/${prefixPackageMap[prefix]})`,
    ``,
    `## Installation`,
    ``,
    `\`\`\``,
    `$ npm i --save @fortawesome/${prefixPackageMap[prefix]}`,
    `\`\`\``,
    ``,
    `Or`,
    ``,
    `\`\`\``,
    `$ yarn add @fortawesome/${prefixPackageMap[prefix]}`,
    `\`\`\``,
    ``,
    `## Documentation`,
    ``,
    `Get started [here](https://fontawesome.com/how-to-use/on-the-web/setup/getting-started). Continue your journey [here](https://fontawesome.com/how-to-use/on-the-web/advanced).`,
    ``,
    `Or go straight to the [API documentation](https://fontawesome.com/how-to-use/with-the-api).`,
    ``,
    `## Issues and support`,
    ``,
    `Start with [GitHub issues](https://github.com/FortAwesome/Font-Awesome/issues) and ping us on [Twitter](https://twitter.com/fontawesome) if you need to.`,
  ].join('\n');
}
function generateLicenseTxtFile({}: AllDataProps) {
  return [
    `Font Awesome Pro License`,
    `------------------------`,
    ``,
    `Font Awesome Pro is commercial software that requires a paid license. Full`,
    `Font Awesome Pro license: https://fontawesome.com/license.`,
    ``,
    `# Commercial License`,
    `The Font Awesome Pro commercial license allows you to pay for FA Pro once, own`,
    `it, and use it just about everywhere you'd like.`,
    ``,
    `# Attribution`,
    `Attribution is not required by the Font Awesome Pro commercial license.`,
    ``,
    `# Brand Icons`,
    `All brand icons are trademarks of their respective owners. The use of these`,
    `trademarks does not indicate endorsement of the trademark holder by Font`,
    `Awesome, nor vice versa. **Please do not use brand logos for any purpose except`,
    `to represent the company, product, or service to which they refer.**`,
    ``,
  ].join('\n');
}
