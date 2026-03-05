import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const cards = [
  {
    emoji: '🔧',
    title: 'Herramientas',
    description: 'Comparación de GitHub Copilot, Claude Code, Gemini CLI y Cursor',
    to: '/docs/herramientas',
  },
  {
    emoji: '🤖',
    title: 'Agentes',
    description: 'Entidades autónomas que completan tareas de múltiples pasos',
    to: '/docs/agentes',
  },
  {
    emoji: '⚡',
    title: 'Skills',
    description: 'Capacidades reutilizables que los agentes pueden invocar',
    to: '/docs/skills',
  },
  {
    emoji: '📋',
    title: 'Instructions',
    description: 'Archivos de contexto que definen el comportamiento de la IA',
    to: '/docs/instructions',
  },
  {
    emoji: '🪝',
    title: 'Hooks',
    description: 'Scripts que se ejecutan en eventos del ciclo de vida (Claude Code)',
    to: '/docs/hooks',
  },
  {
    emoji: '🔌',
    title: 'MCP Servers',
    description: 'Protocolo estándar para conectar IA con herramientas externas',
    to: '/docs/mcp-servers',
  },
  {
    emoji: '🔄',
    title: 'Flujos',
    description: 'Ejemplos end-to-end combinando múltiples features',
    to: '/docs/flujos',
  },
  {
    emoji: '🆘',
    title: 'Troubleshooting',
    description: 'Solución de problemas comunes',
    to: '/docs/troubleshooting',
  },
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Guía práctica de agentes, skills, hooks y MCP servers para herramientas de IA">
      <header className={styles.heroBanner}>
        <div className="container">
          <h1 className={styles.heroTitle}>Agentes y Herramientas IA</h1>
          <p className={styles.heroSubtitle}>
            Guía práctica: agentes, skills, hooks y MCP servers para GitHub Copilot, Claude Code, Gemini CLI y Cursor
          </p>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Empezar →
          </Link>
        </div>
      </header>
      <main className="container">
        <div className={styles.warningBanner}>
          <strong>⚠️ Modelo ≠ Producto</strong> — GitHub Copilot CLI puede usar Claude Sonnet como backend, pero sigue siendo Copilot.
          Los archivos de config siempre siguen al <strong>PRODUCTO</strong>.
        </div>
        <div className={styles.cardGrid}>
          {cards.map((card) => (
            <Link key={card.title} to={card.to} className={styles.card}>
              <div className={styles.cardEmoji}>{card.emoji}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  );
}
