#!/bin/bash

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set, using placeholder for build..."
  export DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
fi

# Generate Prisma Client
npx prisma generate

echo "Prisma Client generated successfully"
