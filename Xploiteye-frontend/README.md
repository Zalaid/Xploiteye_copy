# XploitEye Frontend - Unified Platform

This is the unified frontend for XploitEye, a multi-agentic red & blue team cybersecurity platform. The project combines landing pages (React.js) and dashboard functionality (Next.js with TypeScript) into a single Next.js application.

## Architecture

### Project Structure

```
xploiteye-frontend/
├── public/                  # Static assets (logos, icons, animations)
├── src/
│   ├── auth/               # Authentication system
│   ├── components/         # Shared UI components
│   │   ├── animations/     # Animation components
│   │   ├── icons/          # Icon components
│   │   ├── js/             # Landing page components (.js)
│   │   ├── jsx/            # Landing page components (.jsx)
│   │   ├── pages/          # Dashboard page components (.tsx)
│   │   └── ui/             # UI library components (.tsx)
│   ├── pages/              # Next.js pages (routing)
│   │   ├── dashboard/      # Dashboard pages (.tsx)
│   │   ├── index.js        # Landing page
│   │   ├── about.js        # About page
│   │   ├── pricing.js      # Pricing page
│   │   ├── contact.js      # Contact page
│   │   ├── docs.js         # Documentation page
│   │   ├── login.js        # Login page
│   │   └── signup.js       # Sign up page
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # CSS files and Tailwind
│   └── lib/                # Utilities and helpers
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Key Features

### Landing Pages (JavaScript)
- **Home**: Hero section with XploitEye platform overview
- **About**: Company and technology information
- **Pricing**: Subscription plans and pricing tiers
- **Contact**: Contact form and company information
- **Documentation**: Platform guides and API documentation
- **Login/Signup**: Authentication forms

### Dashboard (TypeScript)
- **Scanning Module**: Vulnerability scanning with OWASP Top 10 support
- **Red Agent**: Offensive security and penetration testing tools
- **Blue Agent**: Defensive security and monitoring tools
- **RAG Chatbot**: AI-powered security assistant
- **Vulnerability Analysis**: Advanced vulnerability assessment
- **Reports**: Security assessment reports and analytics
- **Settings**: User preferences and RBAC configuration

### Authentication & Authorization
- **Unified Login**: Single sign-in system across landing and dashboard
- **Role-Based Access**: Admin, Red Agent, Blue Agent, User roles
- **Route Protection**: Automatic redirection based on authentication status

### Design System
- **Dark Theme**: Matrix-inspired dark background (#0a0a0a) with neon green accents (#00ff99)
- **Typography**: Modern sans-serif fonts (Inter/Poppins)
- **Animations**: Smooth, GPU-accelerated animations with Lottie support
- **Responsive**: Mobile-first responsive design

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Development Guidelines

### File Extensions
- **Landing Pages**: Use `.js` for maintaining compatibility with existing components
- **Dashboard**: Use `.tsx` for TypeScript components with type safety
- **Shared Components**: Can be either `.js` or `.tsx` based on complexity

### Authentication Flow
1. **Unauthenticated Users**: Can only access landing pages
2. **Authenticated Users**: Get redirected to `/dashboard` after login
3. **Role-Based Access**: Different dashboard features based on user role

### Styling
- **TailwindCSS**: Primary styling framework
- **CSS Modules**: Existing component-specific styles preserved
- **Global Styles**: Unified theme variables in `globals.css`

### Component Organization
- **Landing Components**: `src/components/js/` and `src/components/jsx/`
- **Dashboard Components**: `src/components/pages/` and `src/components/components/`
- **UI Components**: `src/components/ui/` (shadcn/ui compatible)

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=XploitEye
```

## Technology Stack

- **Framework**: Next.js 15 with React 18
- **TypeScript**: Full TypeScript support for dashboard components
- **Styling**: TailwindCSS + CSS Modules
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion + Lottie
- **Charts**: Recharts
- **State Management**: React Context + Hooks

## Contributing

1. **Landing Pages**: Maintain existing `.js` structure and styling
2. **Dashboard**: Use TypeScript and follow existing patterns
3. **Shared Components**: Ensure compatibility between JS and TSX usage
4. **Testing**: Run `npm run type-check` before committing

## License

Private - XploitEye Platform