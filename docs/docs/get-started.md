# Get Started

Ready to get started with Estrela? 🚀 We've got you covered! To make the most out of the examples in this documentation, you'll need to use our special Babel plugin for processing JSX/TSX files. Don't worry; it's super easy!

First things first, let's set up your Estrela environment. Just run the `degit` command to create a new project based on our default template:

```bash
$ npx degit estrelajs/template my-project-name
```

This command sets up a fresh TypeScript project with `vite` as the package bundler and the `vite-plugin-estrela` plugin all ready to go. ✨

Now, to start the `vite` server and see your app in action, follow these simple steps:

```bash
$ cd my-project-name
$ yarn install
$ yarn dev
```

`Vite` will serve your application on `localhost:3000`, and you'll see the default Estrela startup page.

::: tip
While you can use Estrela as a regular JavaScript library without vite or babel plugins, we highly recommend using them. They make development a breeze with their handy features, making your code cleaner and easier to maintain. So why not make life a little simpler? 😉
:::
