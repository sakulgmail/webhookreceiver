# Overview

This is a Meraki webhook alert dashboard application that provides real-time monitoring and management of network alerts. The system receives webhook notifications from Cisco Meraki devices and presents them through a comprehensive web dashboard. It features alert categorization, metrics tracking, system configuration, and detailed logging capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the client application
- **Vite** as the build tool and development server with hot module replacement
- **shadcn/ui** component library built on Radix UI primitives for consistent UI components
- **Tailwind CSS** for styling with custom color variables and design system
- **TanStack React Query** for server state management and data fetching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod resolvers for form validation

## Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **In-memory storage** using Maps for development/demo purposes with plans for PostgreSQL integration
- **Webhook endpoint** (`/api/webhook/meraki`) for receiving Meraki device alerts
- **RESTful API design** with endpoints for alerts, metrics, logs, and configuration
- **Request/response logging middleware** for debugging and monitoring

## Data Storage Solutions
- **Drizzle ORM** configured for PostgreSQL with schema definitions
- **Three main entities**: alerts, webhook logs, and webhook configuration
- **Zod schemas** for runtime validation and type safety
- **Database migrations** managed through Drizzle Kit
- **Neon Database** integration for serverless PostgreSQL

## Authentication and Authorization
- Currently uses basic session-based approach with `connect-pg-simple` for session storage
- No complex authentication implemented - designed for internal network monitoring use

## External Dependencies
- **Cisco Meraki webhooks** as the primary data source for network alerts
- **Neon Database** for PostgreSQL hosting in production
- **Replit development environment** with specific plugins for cartographer and error handling
- **Google Fonts** (Roboto, DM Sans, Fira Code, Geist Mono) for typography
- **Comprehensive UI component library** from Radix UI for accessibility and functionality

## Key Features
- **Real-time alert processing** with automatic categorization (security, connectivity, performance)
- **Metrics dashboard** showing active alerts, daily counts, resolved alerts, and webhook statistics
- **Alert filtering and management** with status updates and type-based filtering
- **System configuration** for webhook settings including port and signature validation
- **Comprehensive logging** with different log levels and detailed request tracking
- **Responsive design** with mobile-first approach and dark mode support