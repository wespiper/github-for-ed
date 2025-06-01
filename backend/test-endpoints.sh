#!/bin/bash

echo "🧪 Testing Scribe Tree API Endpoints"
echo "====================================="

# Test health endpoints
echo
echo "📊 Health Check Tests"
echo "Express Health Check:"
curl -s http://localhost:5001/api/health | jq '.' || echo "❌ Express health check failed"

echo
echo "Fastify Health Check:"
curl -s http://localhost:3001/health | jq '.' || echo "❌ Fastify health check failed"

# Test auth endpoints
echo
echo "🔐 Auth Endpoint Tests"
echo "Testing /api/auth/login on Express (5001):"
curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.' || echo "❌ Express login failed"

echo
echo "Testing /api/auth/login on Fastify (3001):"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.' || echo "❌ Fastify login failed"

# Test token verification
echo
echo "Testing /api/auth/verify on Express (5001):"
curl -s -X POST http://localhost:5001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"fake.jwt.token"}' | jq '.' || echo "❌ Express verify failed"

echo
echo "Testing /api/auth/verify on Fastify (3001):"
curl -s -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"fake.jwt.token"}' | jq '.' || echo "❌ Fastify verify failed"

# Test AI endpoints
echo
echo "🤖 AI Endpoint Tests"
echo "Testing /api/ai/generate on Express (5001):"
curl -s -X POST http://localhost:5001/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake.jwt.token" \
  -d '{"prompt":"Generate feedback","type":"feedback"}' | jq '.' || echo "❌ Express AI generate failed"

echo
echo "Testing /api/ai/generate on Fastify (3001):"
curl -s -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake.jwt.token" \
  -d '{"prompt":"Generate feedback","type":"feedback"}' | jq '.' || echo "❌ Fastify AI generate failed"

echo
echo "Testing /api/ai/capabilities on Fastify (3001):"
curl -s -X GET http://localhost:3001/api/ai/capabilities \
  -H "Authorization: Bearer fake.jwt.token" | jq '.' || echo "❌ Fastify AI capabilities failed"

echo
echo "✅ Endpoint testing complete!"