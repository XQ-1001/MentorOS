#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Verify DATABASE_URL is loaded
echo "DATABASE_URL: $DATABASE_URL"

# Generate Prisma client with correct DATABASE_URL
npx prisma generate

# Start development server
npm run dev
