# Get Started

Estrela has its own babel plugin to process JSX/TSX files which is required to make all the functionality work.

The easiest way to setup a new Estrela environment is by running `degit` to create a new project based on the default Estrela template.

```bash
$ npx degit estrelajs/template my-project-name
```

It will bootstrap a typescript project using `vite` as the package bundler with `vite-plugin-estrela` already installed and configured.


To start the `vite` server, you need to install its dependencies and run `dev` script.

```bash
$ cd my-project-name
$ yarn install
$ yarn dev
```

`Vite` will serve the application under `localhost:3000` displaying a simple startup page.

::: tip
Estrela is a normal JavaScript library, so it's possible to run it without using `vite` or `babel` plugins. However it's recommended to use them to enable all Estrela features.
:::
