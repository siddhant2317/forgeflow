export const workOrderTypeDefs = /* GraphQL */ `
  enum WorkOrderStatus {
    PENDING
    IN_PROGRESS
    COMPLETE
  }

  type Step {
    id: ID!
    description: String!
    completed: Boolean!
    workOrderId: ID!
  }

  type WorkOrder {
    id: ID!
    title: String!
    status: WorkOrderStatus!
    partId: ID!
    part: Part!
    steps: [Step!]!
    createdAt: String!
  }

  input CreateWorkOrderInput {
    title: String!
    partId: ID!
    steps: [String!]!
  }

  extend type Query {
    workOrders(status: WorkOrderStatus): [WorkOrder!]!
    workOrder(id: ID!): WorkOrder
  }

  extend type Mutation {
    createWorkOrder(input: CreateWorkOrderInput!): WorkOrder!
    updateWorkOrderStatus(id: ID!, status: WorkOrderStatus!): WorkOrder!
    completeStep(stepId: ID!): Step!
  }
`;
