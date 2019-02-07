# vue-cli-plugin-browser-extension
Browser extension development plugin for vue-cli 3.x

## What does it do?
This is intended to be a vue-cli@3.x replacement for [https://github.com/Kocal/vue-web-extension](https://github.com/Kocal/vue-web-extension).

This plugin changes the `serve` command for your vue applications.
This new command is only for running a livereload server while testing out your browser extension.

This removes the entrypoint of `main.js`, and as such will not scaffold a general vue app.
That behavior might change when support for a standalone tab application exists, but for now it is gone.

Packaging and deploying will still be done with `yarn build` and zipping in up for Chrome, Firefox, or whichever other browser you wish to develop for.

It makes some assumptions about your project setup.
I hope to be able to scaffold an app so that identifying the below in unnecessary.

```
|- public/
  |- icons/
    |- Icons for your extension. Should include a 16, 19, 38, 48, 128 px square image
|- src/
   |- assets/
      |- Static assets in use in your app, like logo.png
   |- content_scripts
      |- content-script.js
   |- options/ (asked during project generation)
      |- App.vue
      |- options.html
      |- options.js
   |- popup/
      |- router/
         |- pages/
            |- Index.vue
         |- index.js
         |- routes.js
      |- App.vue
      |- popup.html
      |- popup.js
   |- standalone/
      |- router/
         |- pages/
            |- Index.vue
         |- index.js
         |- routes.js
      |- App.vue
      |- standalone.html
      |- standalone.js
   |- store/
      |- actions.js
      |- getters.js
      |- index.js
      |- mutation-types.js
      |- mutations.js
   |- background.js
   |- manifest.json
```

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
    }
  }
}
```

- **components**
  - Type: `Object.<string, boolean>`

  The browser extension components that will be managed by this plugin.

  Valid components are:
  - background
  - popup
  - options
  - contentScripts
  - standalone

  ```js
  components: {
    background: true,
    contentScripts: true
  }
  ```

- **componentOptions**
  - Type: `Object.<string, Object>`

  See [Component options](#component-options).

- **manifestSync**
  - Type: `Array<string>`
  - Default: `['version']`

  Array containing names of `manifest.json` keys that will be automatically synced with `package.json` on build.

  Currently, the only supported keys are `version` and `description`.

- **api**
  - Type: `'chrome'|'browser'`
  - Default: `'browser'`

  Browser extension API to use.

- **usePolyfill**
  - Type: `boolean`
  - Default: `true`

  Whether to add [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) to polyfill WebExtension APIs in chrome.

- **autoImportPolyfill**
  - Type: `boolean`
  - Default: `true`

  Whether to auto import `webextension-polyfill` using Webpack's [ProvidePlugin](https://webpack.js.org/plugins/provide-plugin/).

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
            'content1': 'src/content-script1.js',
            'content2': 'src/content-script2.js'
          }
        }
      }
    }
  }
}
```

#### background

- **entry**
  - Type: `string|Array<string>`

  Background script as webpack entry using the [single entry shorthand syntax](https://webpack.js.org/concepts/entry-points/#single-entry-shorthand-syntax).

  ```js
  background: {
    entry: 'src/my-background-script.js'
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

## Testing
This library is following the standard styling of vue projects, and those are really the only tests to perform.

```sh
yarn test
```

## Roadmap
- Add some generator options for other pieces of browser extensions. This includes scaffolding the components/dirs, and registering the build options into the build time hooks.
  - Dev Tools
- A preset
- Key Generation
- Cleanup the dist-zip directory

## Credits
- [https://github.com/Kocal/vue-web-extension](https://github.com/Kocal/vue-web-extension) For inspiration on app and build structure
- [https://github.com/YuraDev/vue-chrome-extension-template](https://github.com/YuraDev/vue-chrome-extension-template) For the logo crop and app/scaffold structure
- [@YuraDev](https://github.com/YuraDev) for the wonderful WCER plugin for livereloading extensions
