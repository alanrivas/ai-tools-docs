import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Herramientas',
      items: [
        'herramientas/index',
        'herramientas/github-copilot',
        'herramientas/claude-code',
        'herramientas/gemini-cli',
        'herramientas/cursor',
        'herramientas/getting-started-copilot',
        'herramientas/getting-started-claude',
        'herramientas/getting-started-gemini',
        'herramientas/getting-started-cursor',
        'herramientas/limites',
      ],
    },
    {
      type: 'category',
      label: 'Tools',
      items: [
        'tools/index',
      ],
    },
    {
      type: 'category',
      label: 'Agentes',
      items: [
        'agentes/index',
        'agentes/por-herramienta',
        'agentes/ejemplos',
      ],
    },
    {
      type: 'category',
      label: 'Skills',
      items: [
        'skills/index',
        'skills/ejemplos',
        'skills/por-herramienta',
      ],
    },
    {
      type: 'category',
      label: 'Instructions y Prompts',
      items: [
        'instructions/index',
        'instructions/por-herramienta',
        'instructions/ejemplos',
      ],
    },
    {
      type: 'category',
      label: 'Hooks',
      items: [
        'hooks/index',
        'hooks/ejemplos',
        'hooks/por-herramienta',
      ],
    },
    {
      type: 'category',
      label: 'MCP Servers',
      items: [
        'mcp-servers/index',
        'mcp-servers/ejemplos',
      ],
    },
    {
      type: 'category',
      label: 'Flujos de Trabajo',
      items: [
        'flujos/index',
        'flujos/revision-pr',
        'flujos/generar-tests',
        'flujos/documentar-codigo',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/index',
      ],
    },
    {
      type: 'category',
      label: 'Anti-patrones',
      items: ['antipatrones/index'],
    },
    'glosario/index',
    'cheatsheet/index',
  ],
};

export default sidebars;
