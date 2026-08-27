export const dashboardTypeDefs = /* GraphQL */ `
  type DashboardStats {
    totalParts: Int!
    openWorkOrders: Int!
    lowInventoryCount: Int!
    completedWorkOrdersThisMonth: Int!
  }

  type ActivityLog {
    id: ID!
    action: String!
    entityType: String!
    entityId: String!
    description: String!
    createdAt: String!
  }

  extend type Query {
    dashboardStats: DashboardStats!
    recentActivity(limit: Int): [ActivityLog!]!
  }
`;
