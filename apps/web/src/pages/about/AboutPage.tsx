function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Badge({ label, color = 'blue' }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${colors[color] ?? colors.blue}`}
    >
      {label}
    </span>
  );
}

function StackRow({
  layer,
  tech,
  detail,
  color,
}: {
  layer: string;
  tech: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium sm:w-20 shrink-0 pt-0.5 uppercase tracking-wide">
        {layer}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge label={tech} color={color} />
        </div>
        <p className="text-sm text-gray-600">{detail}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  bullets,
}: {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <ul className="space-y-1">
        {bullets.map((b) => (
          <li key={b} className="text-xs text-gray-600 flex items-start gap-1.5">
            <span className="text-blue-400 mt-0.5">›</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
      {code}
    </pre>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">About LineForge</h1>
        <p className="mt-2 text-gray-500 text-sm max-w-2xl">
          A full-stack manufacturing ERP built as a personal portfolio demo. Covers parts
          management, bill-of-materials trees, inventory tracking, and work order workflows — all
          connected through a GraphQL API backed by a relational database. This project is
          independent and not affiliated with any company or commercial product.
        </p>
      </div>

      {/* Stack */}
      <Section title="Technology Stack">
        <div className="divide-y divide-gray-50">
          <StackRow
            layer="Monorepo"
            tech="pnpm workspaces"
            detail="Three packages: @lineforge/api, @lineforge/web, @lineforge/shared. Single lockfile, shared TypeScript config extended per workspace."
            color="gray"
          />
          <StackRow
            layer="API"
            tech="Apollo Server 4 + GraphQL"
            detail="startStandaloneServer pattern on port 4000. Schema split into per-feature modules (parts, bom, inventory, workorder, dashboard) merged at startup."
            color="violet"
          />
          <StackRow
            layer="Database"
            tech="Prisma ORM + PostgreSQL 16"
            detail="Prisma schema drives both the TypeScript types and SQL migrations. migrate deploy runs automatically on container start. Six models: Part, BOMRelationship, InventoryItem, WorkOrder, Step, ActivityLog."
            color="blue"
          />
          <StackRow
            layer="Web"
            tech="React 18 + Vite + Tailwind"
            detail="Apollo Client for data fetching with InMemoryCache. React Router v6 with lazy-loaded route components. Vite proxies /graphql to the API so no CORS config is needed."
            color="green"
          />
          <StackRow
            layer="Charts"
            tech="Recharts"
            detail="Responsive BarChart on the Dashboard for work order status summary. Tooltip + CartesianGrid with Tailwind-consistent styling."
            color="orange"
          />
          <StackRow
            layer="Testing"
            tech="Vitest + Playwright"
            detail="Unit tests co-located with resolvers using mocked Prisma. Integration tests hit a real test DB. Playwright E2E covers full user flows end-to-end."
            color="rose"
          />
        </div>
      </Section>

      {/* Architecture */}
      <Section title="Architecture">
        <CodeBlock
          code={`Browser (React + Apollo Client)
    │
    │  HTTP POST /graphql
    ▼
Vite Dev Server ──proxy──► Apollo Server 4 (port 4000)
                                │
                                │  Context: { prisma: PrismaClient }
                                │  injected into every resolver
                                ▼
                           Prisma ORM
                                │
                                ▼
                         PostgreSQL 16
                         ┌──────────────────────┐
                         │ Part                 │
                         │ BOMRelationship       │
                         │ InventoryItem         │
                         │ WorkOrder + Step      │
                         │ ActivityLog           │
                         └──────────────────────┘`}
        />
        <p className="text-sm text-gray-500 mt-4">
          Every GraphQL resolver receives a typed <code className="bg-gray-100 px-1 rounded text-xs">Context</code> object containing the
          Prisma client singleton. This makes resolvers straightforward to unit-test — swap the
          context for a mock and the resolver logic is fully isolated.
        </p>
      </Section>

      {/* Key Engineering Decisions */}
      <Section title="Key Engineering Decisions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon="🌳"
            title="Recursive BOM Tree + DataLoader"
            description="Bills of materials can nest arbitrarily deep. Naively walking the tree one level at a time causes N+1 database queries."
            bullets={[
              'DataLoader batches all child lookups at each level into a single WHERE parentId IN (...) query',
              'A visited Set<string> is passed through each recursive call — if a partId appears twice, a circular reference error is thrown immediately',
              'Immutable visited set (new Set(visited)) per branch so sibling parts sharing a sub-component do not false-positive as circular',
            ]}
          />
          <FeatureCard
            icon="⚙️"
            title="Work Order Auto-Status Transitions"
            description="Work order status (PENDING → IN_PROGRESS → COMPLETE) transitions automatically as steps are checked off — no manual status management needed."
            bullets={[
              'completeStep marks the step completed, then re-fetches all steps for that work order',
              'If every step is completed → status set to COMPLETE',
              'If some (but not all) steps are done and WO is still PENDING → status set to IN_PROGRESS',
              'Entire logic lives in a single resolver mutation, covered by both unit and integration tests',
            ]}
          />
          <FeatureCard
            icon="🧪"
            title="Three-Layer Test Strategy"
            description="Tests are co-located with source code and split across three distinct layers with different trade-offs."
            bullets={[
              'Unit tests (Vitest): Prisma mocked with vi.mock — fast, isolated, no DB needed. 30 tests across all resolvers',
              'Integration tests (Vitest + real DB): spin up postgres via docker-compose.test.yml, run actual SQL — catches query bugs unit tests miss',
              'E2E tests (Playwright): full browser against the running stack — covers user-facing flows like create → search → edit',
            ]}
          />
        </div>
      </Section>

      {/* Schema */}
      <Section title="Database Schema">
        <CodeBlock
          code={`model Part {
  id              String            @id @default(cuid())
  partNumber      String            @unique
  name            String
  description     String?
  unit            String
  parentRelations BOMRelationship[] @relation("parent")
  childRelations  BOMRelationship[] @relation("child")
  inventoryItems  InventoryItem[]
  workOrders      WorkOrder[]
}

model BOMRelationship {
  id       String @id @default(cuid())
  parentId String
  childId  String
  quantity Float
  @@unique([parentId, childId])   // prevents duplicate BOM edges
}

model WorkOrder {
  id      String          @id @default(cuid())
  title   String
  status  WorkOrderStatus @default(PENDING)   // enum
  partId  String
  steps   Step[]
}

model Step {
  id          String    @id @default(cuid())
  workOrderId String
  description String
  completed   Boolean   @default(false)
}`}
        />
      </Section>

      {/* GraphQL surface */}
      <Section title="GraphQL API Surface">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Queries
            </h3>
            <ul className="space-y-2 font-mono text-xs text-gray-700 break-all">
              {[
                'health: String!',
                'parts: [Part!]!',
                'part(id: ID!): Part',
                'bomTree(rootPartId: ID!): BOMNode!',
                'inventoryItems(partId, location): [InventoryItem!]!',
                'workOrders(status?): [WorkOrder!]!',
                'workOrder(id: ID!): WorkOrder',
                'dashboardStats: DashboardStats!',
                'recentActivity(limit?): [ActivityLog!]!',
              ].map((q) => (
                <li key={q} className="flex items-start gap-2">
                  <span className="text-blue-400 shrink-0">›</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Mutations
            </h3>
            <ul className="space-y-2 font-mono text-xs text-gray-700 break-all">
              {[
                'createPart(input): Part!',
                'updatePart(id, input): Part!',
                'addBOMRelationship(parentId, childId, qty): BOMNode!',
                'removeBOMRelationship(parentId, childId): Boolean!',
                'addInventoryItem(input): InventoryItem!',
                'createWorkOrder(input): WorkOrder!',
                'updateWorkOrderStatus(id, status): WorkOrder!',
                'completeStep(stepId): Step!',
              ].map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <span className="text-violet-400 shrink-0">›</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Repo structure */}
      <Section title="Repository Structure">
        <CodeBlock
          code={`lineforge-app/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts                 # Apollo Server entrypoint
│   │   │   ├── schema/                  # GraphQL type defs per feature
│   │   │   ├── resolvers/               # Resolvers + co-located *.test.ts files
│   │   │   └── lib/
│   │   │       ├── prisma.ts            # PrismaClient singleton
│   │   │       └── context.ts           # Context factory for Apollo
│   │   └── prisma/
│   │       ├── schema.prisma            # Single source of truth for DB schema
│   │       ├── seed.ts                  # Merlin-1D sample data
│   │       └── migrations/              # 5 versioned SQL migrations
│   └── web/
│       └── src/
│           ├── pages/                   # Route-level components (parts, bom,
│           │                            #   inventory, workorders, dashboard, about)
│           └── App.tsx                  # Lazy-loaded routes + nav
├── e2e/                                 # Playwright specs (4 user flows)
├── docker-compose.yml                   # Full stack: postgres + api + web
├── docker-compose.test.yml              # Isolated test postgres on port 5433
└── .github/workflows/ci.yml            # 5-job CI pipeline`}
        />
      </Section>

      <p className="text-xs text-gray-400 text-center pb-4">
        Built with pnpm · Apollo Server 4 · Prisma · React 18 · Vite · Tailwind · Vitest · Playwright
      </p>
    </div>
  );
}
