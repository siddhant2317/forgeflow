export const partsTypeDefs = /* GraphQL */ `
  type Part {
    id: ID!
    partNumber: String!
    name: String!
    description: String
    unit: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreatePartInput {
    partNumber: String!
    name: String!
    description: String
    unit: String!
  }

  input UpdatePartInput {
    partNumber: String
    name: String
    description: String
    unit: String
  }

  extend type Query {
    parts: [Part!]!
    part(id: ID!): Part
  }

  extend type Mutation {
    createPart(input: CreatePartInput!): Part!
    updatePart(id: ID!, input: UpdatePartInput!): Part!
  }
`;
