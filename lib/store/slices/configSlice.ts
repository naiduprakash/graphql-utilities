import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConfigState {
  version: number; // Version for migration purposes
  inputMode: 'url' | 'schema'; // Toggle between URL and Schema input
  graphqlEndpoint: string;
  graphqlSchemaText: string; // For pasted GraphQL schema
  customHeaders: Record<string, string>;
  isGenerating: boolean;
  lastGenerated: string | null;
}

const CURRENT_VERSION = 3; // Increment this when you want to force a reset

const getDefaultSchema = () => `# E-Commerce GraphQL Schema Example
# This schema demonstrates 3-4 levels of nested relationships

type Query {
  # Get all users
  users: [User!]!
  # Get user by ID
  user(id: ID!): User
  # Get all products
  products(category: String): [Product!]!
  # Get product by ID
  product(id: ID!): Product
  # Get all orders
  orders(userId: ID): [Order!]!
  # Get order by ID
  order(id: ID!): Order
  # Get all categories
  categories: [Category!]!
}

type Mutation {
  # Create a new user
  createUser(input: CreateUserInput!): User!
  # Update user information
  updateUser(id: ID!, input: UpdateUserInput!): User!
  # Delete a user
  deleteUser(id: ID!): Boolean!
  # Create a new product
  createProduct(input: CreateProductInput!): Product!
  # Create a new order
  createOrder(input: CreateOrderInput!): Order!
  # Add review to product
  addReview(productId: ID!, input: ReviewInput!): Review!
}

# User Type - Level 1
type User {
  id: ID!
  username: String!
  email: String!
  firstName: String!
  lastName: String!
  fullName: String!
  # Level 2: User has orders
  orders: [Order!]!
  # Level 2: User has reviews
  reviews: [Review!]!
  # Level 2: User profile information
  profile: UserProfile!
  createdAt: String!
  updatedAt: String!
}

# User Profile - Level 2
type UserProfile {
  bio: String
  avatar: String
  phone: String
  # Level 3: Address information
  address: Address
  # Level 3: User preferences
  preferences: UserPreferences!
}

# Address Type - Level 3
type Address {
  street: String!
  city: String!
  state: String!
  zipCode: String!
  country: String!
  # Level 4: Coordinates for the address
  coordinates: Coordinates
}

# Coordinates Type - Level 4
type Coordinates {
  latitude: Float!
  longitude: Float!
}

# User Preferences - Level 3
type UserPreferences {
  newsletter: Boolean!
  notifications: Boolean!
  theme: String!
  language: String!
}

# Product Type - Level 1
type Product {
  id: ID!
  name: String!
  description: String!
  price: Float!
  stock: Int!
  # Level 2: Product category
  category: Category!
  # Level 2: Product images
  images: [ProductImage!]!
  # Level 2: Product reviews
  reviews: [Review!]!
  # Level 2: Product specifications
  specifications: ProductSpecifications!
  createdAt: String!
  updatedAt: String!
}

# Category Type - Level 2
type Category {
  id: ID!
  name: String!
  description: String
  # Level 3: Parent category for nested categories
  parentCategory: Category
  # Level 3: Subcategories
  subcategories: [Category!]!
  # Products in this category
  products: [Product!]!
}

# Product Image - Level 3
type ProductImage {
  id: ID!
  url: String!
  alt: String
  isPrimary: Boolean!
}

# Product Specifications - Level 3
type ProductSpecifications {
  weight: Float
  dimensions: Dimensions
  material: String
  color: String
  brand: String
}

# Dimensions Type - Level 4
type Dimensions {
  length: Float!
  width: Float!
  height: Float!
  unit: String!
}

# Review Type - Level 2
type Review {
  id: ID!
  rating: Int!
  title: String!
  comment: String!
  # Level 3: User who wrote the review
  user: User!
  # Level 3: Product being reviewed
  product: Product!
  # Level 3: Review metadata
  metadata: ReviewMetadata!
  createdAt: String!
  updatedAt: String!
}

# Review Metadata - Level 4
type ReviewMetadata {
  helpful: Int!
  verified: Boolean!
  images: [String!]
}

# Order Type - Level 1
type Order {
  id: ID!
  orderNumber: String!
  status: OrderStatus!
  total: Float!
  # Level 2: User who placed the order
  user: User!
  # Level 2: Order items
  items: [OrderItem!]!
  # Level 2: Shipping information
  shipping: ShippingInfo!
  # Level 2: Payment information
  payment: PaymentInfo!
  createdAt: String!
  updatedAt: String!
}

# Order Status Enum
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# Order Item - Level 3
type OrderItem {
  id: ID!
  quantity: Int!
  price: Float!
  # Level 4: Product details
  product: Product!
  # Level 4: Item snapshot at time of order
  snapshot: ProductSnapshot!
}

# Product Snapshot - Level 4
type ProductSnapshot {
  name: String!
  description: String!
  image: String!
}

# Shipping Info - Level 3
type ShippingInfo {
  method: String!
  trackingNumber: String
  estimatedDelivery: String
  # Level 4: Shipping address
  address: Address!
}

# Payment Info - Level 3
type PaymentInfo {
  method: String!
  status: PaymentStatus!
  transactionId: String
  # Level 4: Billing address
  billingAddress: Address!
}

# Payment Status Enum
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

# Input Types for Mutations
input CreateUserInput {
  username: String!
  email: String!
  password: String!
  firstName: String!
  lastName: String!
}

input UpdateUserInput {
  username: String
  email: String
  firstName: String
  lastName: String
}

input CreateProductInput {
  name: String!
  description: String!
  price: Float!
  stock: Int!
  categoryId: ID!
}

input CreateOrderInput {
  userId: ID!
  items: [OrderItemInput!]!
  shippingAddressId: ID!
  paymentMethod: String!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}

input ReviewInput {
  rating: Int!
  title: String!
  comment: String!
}`;

const initialState: ConfigState = {
  version: CURRENT_VERSION,
  inputMode: 'schema',
  graphqlEndpoint: '',
  graphqlSchemaText: getDefaultSchema(),
  customHeaders: {},
  isGenerating: false,
  lastGenerated: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setInputMode: (state, action: PayloadAction<'url' | 'schema'>) => {
      state.inputMode = action.payload;
    },
    setGraphqlEndpoint: (state, action: PayloadAction<string>) => {
      state.graphqlEndpoint = action.payload;
    },
    setGraphqlSchemaText: (state, action: PayloadAction<string>) => {
      state.graphqlSchemaText = action.payload;
    },
    setCustomHeaders: (state, action: PayloadAction<Record<string, string>>) => {
      state.customHeaders = action.payload;
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setLastGenerated: (state, action: PayloadAction<string>) => {
      state.lastGenerated = action.payload;
    },
    resetConfig: () => initialState,
  },
});

export const {
  setInputMode,
  setGraphqlEndpoint,
  setGraphqlSchemaText,
  setCustomHeaders,
  setGenerating,
  setLastGenerated,
  resetConfig,
} = configSlice.actions;

export default configSlice.reducer;
