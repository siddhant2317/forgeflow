const baseTypeDefs = /* GraphQL */ `
  type Query {
    health: String!
  }

  type Mutation {
    _empty: String
  }
`;

export { baseTypeDefs };

export * from './parts.schema.js';
export * from './bom.schema.js';
export * from './inventory.schema.js';
export * from './workorder.schema.js';
export * from './dashboard.schema.js';
export * from './auth.schema.js';
