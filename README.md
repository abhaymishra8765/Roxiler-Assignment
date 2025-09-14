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
  - If the user is a **Store Owner**, also show their store's rating.
- Can log out.

### Normal User

- Register (Sign up).
- Login & Logout.
- Change password after logging in.
- Browse all stores with:
  - Name
  - Address
  - Overall rating
  - User's submitted rating
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

  @@unique([userId, storeId])
  @@index([storeId])
  @@index([userId])
}


```

---

## Validations

- **Name**: 20–60 characters.
- **Address**: Max 400 characters.
- **Password**: 8–16 chars, at least 1 uppercase + 1 special char.
- **Email**: Must follow standard email format.
- **Rating**: Integer between 1 and 5.

---

## Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/dbname"
PORT=4000
ACCESS_TOKEN_SECRET="your_jwt_secret_here"
REFRESH_TOKEN_SECRET="your_refresh_secret_here"
```

---

## Setup Instructions

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend runs at: http://localhost:5173
- Backend runs at: http://localhost:4000

---

## API Endpoints

### Auth

- `POST /auth/register` → Register as Normal User
- `POST /auth/login` → Login (returns JWT)
- `POST /auth/logout` → Logout

### Stores

- `GET /stores` → List/search stores (with avgRating + userSubmittedRating)
- `GET /stores/:id` → Store details + ratings
- `POST /stores/:id/rating` → Submit/Update rating

### Admin

- `GET /admin/stats` → Total users, stores, ratings
- `GET /admin/users` → List/filter users
- `POST /admin/users` → Add user
- `GET /admin/stores` → List/filter stores
- `POST /admin/stores` → Add store

---

## Example curl Commands

### Register User

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"This is a valid user name more than 20 chars","email":"test@example.com","password":"Abcd@1234"}'
```

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Abcd@1234"}'
```

### Get Stores

```bash
curl -s "http://localhost:4000/stores?page=1&pageSize=10"
```

### Submit Rating

```bash
curl -X POST http://localhost:4000/stores/1/rating \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rating":5}'
```

---

## Security Notes

- Passwords are hashed with bcrypt.
- JWTs are used for authentication.
- Role-based middleware enforces access.

For production:

- Use httpOnly secure cookies for refresh tokens.
- Use HTTPS.
- Add rate limiting.

---

## Future Improvements

- Add pagination controls in UI.
- Add charts for store owners (rating trends).
- Email verification
- Dockerize app with PostgreSQL service.

---

## License

This project is for educational/demo purposes (coding challenge).  
You are free to use or extend it.

---

## Contact

- **Email**: work.abhay87@gmail.com
- **Mobile**: +91 8299528418
