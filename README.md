# Roxilar — Store Ratings App

A full-stack web application that allows users to rate stores (1–5).  
Implements a single login system with **role-based access**:

- **SYSTEM_ADMIN** — manage users & stores, view dashboards and lists with filters.
- **STORE_OWNER** — see ratings & average rating for their stores.
- **NORMAL_USER** — browse/search stores, submit or update ratings.

---

## Tech Stack

- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (with Prisma ORM)
- **Frontend**: React + Vite + react-router + react-hook-form
- **Auth**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt
- **Validation**: express-validator (server), react-hook-form (client)

---

## Features

### System Administrator

- Add new **stores, normal users, and admin users**.
- Dashboard showing:
  - Total number of users
  - Total number of stores
  - Total number of ratings
- View and filter **stores** by Name, Email, Address, Rating.
- View and filter **users** by Name, Email, Address, Role.
- View details of any user:
  - If the user is a **Store Owner**, also show their store’s rating.
- Can log out.

### Normal User

- Register (Sign up).
- Login & Logout.
- Change password after logging in.
- Browse all stores with:
  - Name
  - Address
  - Overall rating
  - User’s submitted rating
  - Option to submit or update their rating
- Search stores by **name** or **address**.

### Store Owner

- Login & Logout.
- Change password after logging in.
- Dashboard showing:
  - List of users who rated their store
  - Average rating of their store.

---

## Database Schema (Prisma)

```prisma
enum Role {
  SYSTEM_ADMIN
  NORMAL_USER
  STORE_OWNER
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  password     String
  address      String?
  role         Role     @default(NORMAL_USER)
  refreshToken String?
  stores       Store[]  @relation("OwnerStores")
  ratings      Rating[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Store {
  id        Int     @id @default(autoincrement())
  name      String
  email     String?
  address   String?
  ownerId   Int?
  owner     User?   @relation("OwnerStores", fields: [ownerId], references: [id])
  ratings   Rating[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Rating {
  id        Int     @id @default(autoincrement())
  user      User    @relation(fields: [userId], references: [id])
  userId    Int
  store     Store   @relation(fields: [storeId], references: [id])
  storeId   Int
  rating    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, storeId], name: "userId_storeId_key")
}
```
