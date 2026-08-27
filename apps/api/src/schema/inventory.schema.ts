export const inventoryTypeDefs = /* GraphQL */ `
  type InventoryItem {
    id: ID!
    partId: ID!
    part: Part!
    location: String!
    quantity: Float!
  }

  input AddInventoryItemInput {
    partId: ID!
    location: String!
    quantity: Float!
  }

  extend type Query {
    inventoryItems(partId: ID, location: String): [InventoryItem!]!
  }

  extend type Mutation {
    addInventoryItem(input: AddInventoryItemInput!): InventoryItem!
  }
`;
