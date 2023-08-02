import { defineConfig } from 'vuepress/config';
import { description } from '../package.json';

export default defineConfig({
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Estrela',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#009DFF' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    ],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: 'estrelajs/estrela',
    docsBranch: 'main',
    logo: '/logo.png',
    docsDir: 'docs',
    editLinks: true,
    editLinkText: 'Help us improve documentation!',
    lastUpdated: true,
    smoothScroll: false,
    searchPlaceholder: 'Search...',
    nav: [
      {
        text: 'Docs',
        link: '/docs/',
      },
      {
        text: 'Api',
        link: '/api/',
      },
    ],
    sidebar: {
      '/docs/': [
        {
          title: 'Docs',
          collapsable: false,
          children: [
            '',
            'get-started',
            'signals',
            'effects',
            'template',
            'component',
            // 'store',
            // 'router',
          ],
        },
      ],
    },
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: ['@vuepress/plugin-back-to-top', '@vuepress/plugin-medium-zoom'],
});
