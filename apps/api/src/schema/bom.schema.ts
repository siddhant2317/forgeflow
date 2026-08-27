export const bomTypeDefs = /* GraphQL */ `
  type BOMNode {
    part: Part!
    quantity: Float!
    children: [BOMNode!]!
  }

  extend type Query {
    bomTree(rootPartId: ID!): BOMNode!
  }

  extend type Mutation {
    addBOMRelationship(parentId: ID!, childId: ID!, quantity: Float!): BOMNode!
    removeBOMRelationship(parentId: ID!, childId: ID!): Boolean!
  }
`;
