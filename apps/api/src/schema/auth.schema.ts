export const authTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    name: String
    avatarUrl: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Query {
    currentUser: User
  }

  extend type Mutation {
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    googleLogin(googleToken: String!): AuthPayload!
  }
`;
