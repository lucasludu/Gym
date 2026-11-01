# Gym

[![CI](https://github.com/lucasludu/Gym/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasludu/Gym/actions/workflows/ci.yml)

App mobile para socios de un gimnasio: reservar clases, seguir la rutina, registrar entrenamientos y ver el progreso. Proyecto de portfolio hecho con React Native + Expo.

> En construcción. La visión del producto está en [`specs/00-producto.md`](specs/00-producto.md) y el plan de trabajo en [`specs/02-tareas.md`](specs/02-tareas.md).

## Cómo correrlo

Requisitos: Node.js 22 o superior y la app **Expo Go** en el celular.

```bash
npm install
cp .env.example .env   # poné la IP local de tu PC en EXPO_PUBLIC_API_URL
npm run mock           # API mock en el puerto 3000
npx expo start         # escaneá el QR con Expo Go
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm test` | Tests (Jest + React Native Testing Library) |
| `npm run lint` | ESLint + Prettier |
| `npm run typecheck` | Chequeo de tipos |
| `npm run format` | Formatea el código |
| `npm run mock` | Levanta json-server con `mock/db.json` |
