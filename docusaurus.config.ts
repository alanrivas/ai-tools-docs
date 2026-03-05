import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Agentes y Herramientas IA',
  tagline: 'Guía práctica de agentes, skills, hooks y MCP servers',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ai-tools-docs.alanrivas.me',
  baseUrl: '/',

  organizationName: 'alanrivas',
  projectName: 'ai-tools-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['es', 'en'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Agentes y Herramientas IA',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Secciones',
          items: [
            { label: 'Introducción', to: '/docs/intro' },
            { label: 'Herramientas', to: '/docs/herramientas' },
            { label: 'Agentes', to: '/docs/agentes' },
            { label: 'Skills', to: '/docs/skills' },
            { label: 'Instructions', to: '/docs/instructions' },
            { label: 'Hooks', to: '/docs/hooks' },
            { label: 'MCP Servers', to: '/docs/mcp-servers' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Agentes y Herramientas IA. Construido con Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
