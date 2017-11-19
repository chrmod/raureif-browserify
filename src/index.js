import Funnel from 'broccoli-funnel';
import MergeTrees from 'broccoli-merge-trees';
import glob from 'glob';
import uppercamelcase from 'uppercamelcase';
import watchify from 'broccoli-watchify';

const getOptions = ({ entries, outputFile, packageName, basePath }) => ({
  browserify: {
    entries,
    paths: [`${basePath}/node_modules`],
    standalone: packageName,
    debug: false,
  },
  outputFile,
  cache: true,
});

export default {
  postBuild(tree, project) {
    const basePath = project.path;
    const packageManifest = project.pkg;
    const packageName = uppercamelcase(packageManifest.name);
    const buildForBrowser = Boolean(packageManifest.browser);
    const outputTrees = [];

    if (!buildForBrowser) {
      return null;
    }

    outputTrees.push(
      watchify(
        tree,
        getOptions({
          basePath,
          entries: ['./index.js'],
          packageName,
          outputFile: 'index.browser.js',
        }),
      ),
    );

    const testFiles = glob
      .sync(`${basePath}/tests/browser/**/*-test.js`)
      .map(filePath => `.${filePath.slice(basePath.length)}`);

    outputTrees.push(
      watchify(
        tree,
        getOptions({
          basePath,
          entries: testFiles,
          packageName,
          outputFile: 'tests/browser/index.browser.js',
        }),
      ),
    );

    return new Funnel(new MergeTrees(outputTrees), {
      include: ['**/*.browser.js'],
    });
  },
};
