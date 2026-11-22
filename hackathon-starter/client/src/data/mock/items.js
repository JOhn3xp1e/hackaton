/**
 * ⚠️ MOCK DATA — for demo/offline development only.
 * Shape matches the `items` table (database/schema.sql) and the API contract
 * (docs/API_CONTRACT.md), using camelCase as returned by the Express API.
 */
const now = Date.now()
const h = 3600 * 1000

export const mockItems = [
  { id: 'a1f0c2d4-0001-4000-8000-000000000001', title: 'Set up project repository', description: 'Monorepo with client, server and database folders.', status: 'done', priority: 'high', category: 'Setup', createdAt: new Date(now - 30 * h).toISOString(), updatedAt: new Date(now - 28 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000002', title: 'Design database schema', description: 'Tables, relations and RLS policies.', status: 'done', priority: 'high', category: 'Database', createdAt: new Date(now - 26 * h).toISOString(), updatedAt: new Date(now - 20 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000003', title: 'Implement REST endpoints', description: 'CRUD for the core resource.', status: 'in_progress', priority: 'high', category: 'Backend', createdAt: new Date(now - 22 * h).toISOString(), updatedAt: new Date(now - 2 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000004', title: 'Build dashboard overview', description: 'Stat cards, chart and activity table.', status: 'in_progress', priority: 'medium', category: 'Frontend', createdAt: new Date(now - 20 * h).toISOString(), updatedAt: new Date(now - 1 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000005', title: 'Write API contract', description: 'Agree request/response shapes as a team.', status: 'done', priority: 'medium', category: 'Docs', createdAt: new Date(now - 19 * h).toISOString(), updatedAt: new Date(now - 18 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000006', title: 'Seed demo data', description: 'Realistic records for the final demo.', status: 'todo', priority: 'medium', category: 'Database', createdAt: new Date(now - 16 * h).toISOString(), updatedAt: new Date(now - 16 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000007', title: 'Form validation', description: 'Client + server validation with matching messages.', status: 'todo', priority: 'low', category: 'Frontend', createdAt: new Date(now - 14 * h).toISOString(), updatedAt: new Date(now - 14 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000008', title: 'Error handling middleware', description: 'Consistent JSON error responses.', status: 'done', priority: 'medium', category: 'Backend', createdAt: new Date(now - 12 * h).toISOString(), updatedAt: new Date(now - 10 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000009', title: 'Responsive layout QA', description: 'Check mobile, tablet and desktop.', status: 'todo', priority: 'low', category: 'Frontend', createdAt: new Date(now - 10 * h).toISOString(), updatedAt: new Date(now - 10 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000010', title: 'Prepare demo script', description: '3-minute walkthrough of the core flow.', status: 'todo', priority: 'high', category: 'Docs', createdAt: new Date(now - 8 * h).toISOString(), updatedAt: new Date(now - 8 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000011', title: 'Postman collection', description: 'Shareable requests for every endpoint.', status: 'in_progress', priority: 'low', category: 'Backend', createdAt: new Date(now - 6 * h).toISOString(), updatedAt: new Date(now - 3 * h).toISOString() },
  { id: 'a1f0c2d4-0001-4000-8000-000000000012', title: 'Old prototype notes', description: 'Kept for reference.', status: 'archived', priority: 'low', category: 'Docs', createdAt: new Date(now - 48 * h).toISOString(), updatedAt: new Date(now - 40 * h).toISOString() },
]

export const mockCategories = ['Setup', 'Frontend', 'Backend', 'Database', 'Docs']
