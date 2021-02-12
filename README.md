# vue-cli-plugin-browser-extension

Browser extension development plugin for vue-cli 3.x

## What does it do?

This is intended to be a vue-cli@3.x replacement for [https://github.com/Kocal/vue-web-extension](https://github.com/Kocal/vue-web-extension).

This plugin changes the `serve` command for your vue applications.
This new command is only for running a livereload server while testing out your browser extension.

This removes the entrypoint of `src/main.js`, and as such will not scaffold a general vue app.

Packaging and deploying will still be done with `yarn build` and zipping in up for Chrome, Firefox, or whichever other browser you wish to develop for.

It makes some assumptions about your project setup.
I hope to be able to scaffold an app so that identifying the below in unnecessary.

```
|- public/
  |- _locales/
    |- en/
      |- messages.json
  |- icons/
    |- Icons for your extension. Should include a 16, 19, 38, 48, and 128px square image
  |- browser-extension.html (default target html template)
|- src/
  |- assets/
    |- Static assets in use in your app, like logo.png
  |- components/
    |- HelloWorld.vue (modified)
  |- content-scripts
    |- content-script.js
  |- devtools/ (asked during project generation)
    |- App.vue
    |- main.js
  |- options/ (asked during project generation)
    |- App.vue
    |- main.js
  |- popup/ (asked during project generation)
    |- App.vue
    |- main.js
  |- override/ (asked during project generation)
    |- App.vue
    |- main.js
  |- standalone/ (asked during project generation)
    |- App.vue
    |- main.js
  |- background.js
  |- manifest.json
```

## System Dependencies

If you wish to use the signing key functionality you will need to have `openssl` available on your system.

## Adding to your project

This can be added to your vuejs project by one of the following methods:

- Using the `vue ui` and searching for this project
- Using the vue cli `vue add browser-extension` command

## Usage

Running the Livereload server.
This will build and write to the local `dist` directory.

This plugin will respect the `outputDir` setting, however it cannot read into passed CLI args, so if you require a custom output dir, be sure to add it in your `vue.config.js` file.
You can then add this as an unpacked plugin to your browser, and will continue to update as you make changes.

**NOTE:** you cannot get HMR support in the popup window, however, closing and reopening will refresh your content.

```sh
yarn serve
yarn build
```

## Plugin options

Plugin options can be set inside your `vue.config.js`:

```js
// vue.config.js
module.exports = {
  pluginOptions: {
    browserExtension: {
      // options...
    },
  },
};
```

- **components**

  - Type: `Object.<string, boolean>`

  The browser extension components that will be managed by this plugin.

  Valid components are:

  - background
  - popup
  - options
  - contentScripts
  - override
  - standalone
  - devtools

  ```js
  components: {
    background: true,
    contentScripts: true
  }
  ```

- **componentOptions**

  - Type: `Object.<string, Object>`

  See [Component options](#component-options).

- **extensionReloaderOptions**

  - Type: `Object.<string, Object>`

  See available options in [webpack-extension-reloader](https://github.com/rubenspgcavalcante/webpack-extension-reloader#how-to-use).

- **manifestSync**

  - Type: `Array<string>`
  - Default: `['version']`

  Array containing names of `manifest.json` keys that will be automatically synced with `package.json` on build.

  Currently, the only supported keys are `version` and `description`.

- **manifestTransformer**

  - Type: `Function`

  Function to modify the manifest JSON outputted by this plugin.

  An example use case is adding or removing permissions depending on which browser is being targeted.

  ```js
  manifestTransformer: (manifest) => {
    if (process.env.BROWSER === 'chrome') {
      manifest.permissions.push('pageCapture');
    }
    return manifest;
  };
  ```

- **modesToZip**

  Deprecated. Any mode will be zipped to the artifacts dir, when `NODE_ENV=production` (the default in the normal `yarn build`). For more information on how to set `NODE_ENV=production` in other modes see [Vue CLI docs – Example Staging Mode](https://cli.vuejs.org/guide/mode-and-env.html#example-staging-mode)

- **artifactsDir**

  - Type: `string`
  - Default: `'./artifacts'`

  Directory where the zipped browser extension should get created.

- **artifactFilename**

  - Type: `Function`
  - Default: ``({name, version, mode}) => `${name}-v${version}-${mode}.zip` ``

  Optional function to generate a custom artifact filename. Useful for naming builds for different browsers.

  The function takes a single object parameter containing:
  - `name` - Name from `package.json`
  - `version` - Version from `package.json`
  - `mode` - Vue CLI mode such as 'production'
  
  For example,

  ```js
  // vue.config.js
  module.exports = {
    pluginOptions: {
      browserExtension: {
        artifactFilename: ({ name, version, mode }) => {
          if (mode === 'production') {
            return `${name}-v${version}-${process.env.BROWSER}.zip`;
          }
          return `${name}-v${version}-${process.env.BROWSER}-${mode}.zip`;
        },
      },
    },
  };
  ```

### Component options

Some browser extension components have additional options which can be set as follows:

```js
// vue.config.js
module.exports = {
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        // <name of component>: <options>
        // e.g.
        contentScripts: {
          entries: {
            content1: 'src/content-script1.js',
            content2: 'src/content-script2.js',
          },
        },
      },
    },
  },
};
```

#### background

- **entry**

  - Type: `string|Array<string>`

  Background script as webpack entry using the [single entry shorthand syntax](https://webpack.js.org/concepts/entry-points/#single-entry-shorthand-syntax).

  ```js
  background: {
    entry: 'src/my-background-script.js';
  }
  ```

#### contentScripts

- **entries**

  - Type: `{[entryChunkName: string]: string|Array<string>}`

  Content scripts as webpack entries using using the [object syntax](https://webpack.js.org/concepts/entry-points/#object-syntax).

  ```js
  contentScripts: {
    entries: {
      'my-first-content-script': 'src/content-script.js',
      'my-second-content-script': 'src/my-second-script.js'
    }
  }
  ```

## Internationalization

Some boilerplate for internationalization has been added. This follows the i18n ([chrome](https://developer.chrome.com/extensions/i18n)|[WebExtention](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n)) spec.
Provided for you is the `default_locale` option in the manifest, and a `_locales` directory.
There is some basic usage of it in the manifest, as well as in some of the boilerplate files.
Since this is largely an out of the box solution provided by the browsers, it is heavily encouraged to utilize it.
If you do not want to translate your app, simply delete the `public/_locales` directory, and no longer use the `browser.i18n` methods.

## Browser Polyfills

This plugin by default adds in the official [mozilla webextension polyfill](https://github.com/mozilla/webextension-polyfill) to the build.
The opinion of this plugin is that developers should be building cross platform, and should have reasonable tooling to do so.
By emphasizing cross platform first, your application will be adhering to the community standards, be ready for distribution to other extension stores, and avoid developing against browser APIs that may have no equivalent.
The polyfill is a no-op on firefox, and only takes up 20.5kb unminified.

If you still feel strongly to not include the polyfill, then this is what you need to add to your webpack chain to do so.

`vue.config.js`

```js
module.exports = {
  chainWebpack(config) {
    config.plugins.delete('provide-webextension-polyfill');
    config.module.rules.delete('provide-webextension-polyfill');
  },
};
```

## Testing

This library is following the standard styling of vue projects, and those are really the only tests to perform.

```sh
yarn test
```

## Roadmap

- A preset
- Cleanup the dist-zip directory

## Credits

- [https://github.com/Kocal/vue-web-extension](https://github.com/Kocal/vue-web-extension) For inspiration on app and build structure
- [https://github.com/YuraDev/vue-chrome-extension-template](https://github.com/YuraDev/vue-chrome-extension-template) For the logo crop and app/scaffold structure
- [@YuraDev](https://github.com/YuraDev) for the wonderful WCER plugin for livereloading extensions
