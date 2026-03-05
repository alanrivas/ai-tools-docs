---
sidebar_position: 2
title: "Copilot: Primeros Pasos"
---

# GitHub Copilot CLI: Primeros Pasos

Esta guía te llevará desde cero hasta tu primer comando con GitHub Copilot CLI en menos de 10 minutos.

## Prerequisitos

- **Cuenta de GitHub**: Necesitas una cuenta activa en [github.com](https://github.com).
- **Suscripción a GitHub Copilot**: El plan gratuito incluye 2.000 completaciones/mes y 50 chats/mes. Los planes de pago ofrecen acceso ilimitado. Puedes activarlo en [github.com/features/copilot](https://github.com/features/copilot).
- **GitHub CLI instalado**: La extensión de Copilot depende de `gh`.

## Paso 1: Instalar GitHub CLI

### Windows

```powershell
winget install GitHub.cli
```

### macOS

```bash
brew install gh
```

### Linux (Debian/Ubuntu)

```bash
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
```

Verifica la instalación:

```bash
gh --version
```

## Paso 2: Autenticarse con GitHub

```bash
gh auth login
```

Sigue el asistente interactivo: elige GitHub.com, autenticación web, y autoriza en el navegador.

Verifica que la autenticación funciona:

```bash
gh auth status
```

## Paso 3: Instalar la extensión de Copilot

```bash
gh extension install github/gh-copilot
```

Verifica que la extensión quedó instalada:

```bash
gh extension list
```

Deberías ver `github/gh-copilot` en la lista.

## Paso 4: Primer comando

Usa el modo `suggest` para obtener un comando de shell:

```bash
gh copilot suggest "listar archivos modificados hoy"
```

Copilot te sugerirá el comando apropiado para tu shell (bash, zsh, PowerShell, etc.) y te preguntará si quieres ejecutarlo, copiarlo al portapapeles, o revisarlo.

Usa el modo `explain` para entender un comando:

```bash
gh copilot explain "git log --oneline --since=1.day"
```

## Paso 5: Modo chat

Para una sesión de preguntas más larga:

```bash
gh copilot chat
```

Dentro del chat puedes hacer preguntas sobre código, pedir sugerencias, y explorar conceptos. Escribe `exit` para salir.

## Archivos de configuración

Los archivos de configuración de GitHub Copilot CLI se almacenan en:

- **Agentes**: `~/.copilot/agents/` (archivos `.yml`)
- **Instrucciones globales**: `~/.copilot/prompts/` 
- **Instrucciones de repositorio**: `.github/copilot-instructions.md`

:::tip Instrucciones de repositorio
El archivo `.github/copilot-instructions.md` en la raíz de tu repo se inyecta automáticamente en cada conversación. Úsalo para definir convenciones del proyecto, stack tecnológico y restricciones específicas.
:::

## Verificar que todo funciona

```bash
# Ver ayuda general
gh copilot --help

# Ver versión de la extensión
gh extension list | grep copilot

# Prueba rápida
gh copilot suggest "mostrar los 10 procesos que más CPU consumen"
```

:::warning Suscripción requerida
Sin una suscripción activa a GitHub Copilot, los comandos devolverán un error de autorización. Verifica tu suscripción en [github.com/settings/copilot](https://github.com/settings/copilot).
:::

## Recursos adicionales

- [Documentación oficial de GitHub Copilot CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line)
- [Ver Agentes para Copilot](../agentes/por-herramienta.md)
- [Ver Instrucciones para Copilot](../instructions/por-herramienta.md)
