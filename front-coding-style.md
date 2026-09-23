# React Native Coding Style Guide

> **Note**: While this project currently uses Next.js, this guide documents the coding patterns and architecture that should be adapted for React Native projects.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [State Management with Zustand](#state-management-with-zustand)
4. [Coding Conventions](#coding-conventions)
5. [Component Patterns](#component-patterns)
6. [Data Fetching & API](#data-fetching--api)
7. [Type Safety](#type-safety)
8. [File Naming Conventions](#file-naming-conventions)

---

## Project Overview

This is a monorepo structure using:
- **Package Manager**: pnpm with workspaces
- **State Management**: Zustand (slice pattern)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Form Management**: React Hook Form with Zod validation
- **Type Safety**: TypeScript with strict mode
- **Code Style**: Prettier + ESLint
- **UI Components**: Custom component library in workspace packages

---

## Folder Structure

### Monorepo Structure
```
kmapp-mono-repo/
├── apps/
│   ├── mios/                    # Main application
│   ├── web/                     # Additional web app
│   └── kmapp-landing-page/      # Landing page
├── packages/
│   ├── ui/                      # Shared UI components
│   ├── typescript-config/       # Shared TS configs
│   └── eslint-config/          # Shared ESLint configs
└── package.json                 # Root package.json
```

### Application Structure (apps/mios)
```
mios/
├── api/                         # API layer
│   ├── apiCaller.ts            # Axios wrapper
│   ├── api-endpoints.constants.ts
│   ├── axios.ts                # Axios instance configuration
│   └── types/                  # API type definitions
├── app/                         # Next.js app directory (routes)
├── components/                  # Reusable UI components
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   └── index.ts
├── containers/                  # Feature modules
│   ├── FeatureName/
│   │   ├── FeatureList/        # List view
│   │   │   ├── FeatureList.tsx
│   │   │   ├── Filters/
│   │   │   │   └── Filter.tsx
│   │   │   ├── FeatureTableToolbarActions.tsx
│   │   │   └── index.tsx
│   │   ├── FeatureDetail/      # Detail/Form view
│   │   │   ├── FeatureDetail.tsx
│   │   │   ├── components/
│   │   │   └── index.tsx
│   │   ├── constants/          # Feature-specific constants
│   │   │   ├── feature.columns.tsx
│   │   │   ├── feature.query-key.ts
│   │   │   ├── feature.schemas.ts
│   │   │   └── feature-routes.constants.ts
│   │   ├── hooks/              # Feature-specific hooks
│   │   │   ├── useGetFeatures.ts
│   │   │   ├── useGetFeature.ts
│   │   │   ├── useCreateFeature.ts
│   │   │   ├── useUpdateFeature.ts
│   │   │   └── useDeleteFeatures.ts
│   │   ├── types/              # Feature type definitions
│   │   │   └── feature.types.ts
│   │   └── README.md           # Feature documentation
├── hooks/                       # Global custom hooks
├── lib/                         # Utility functions
│   ├── utils.ts                # General utilities
│   ├── parsers.ts              # Query param parsers
│   └── data-table.ts           # Table utilities
├── store/                       # Zustand store
│   ├── useStore.ts             # Store composition
│   ├── index.ts                # Exports
│   └── slices/                 # Store slices
│       ├── authenticationSlice.ts
│       ├── navigationControlSlice.ts
│       ├── dashboardSlice.ts
│       └── rbacSlice.ts
├── types/                       # Global type definitions
├── utils/                       # Helper utilities
│   ├── formatCurrency.ts
│   ├── formatDate.ts
│   ├── downloadFile.ts
│   └── localStorage.ts
├── constants/                   # Global constants
│   ├── env.ts
│   └── storage.ts
└── styles/                      # Global styles
```

### Key Organizational Principles

1. **Container Pattern**: Each major feature lives in its own `containers/FeatureName` directory
2. **Co-location**: Feature-specific code (hooks, types, constants) stays with the feature
3. **Separation of Concerns**: 
   - `components/` = Reusable, generic UI components
   - `containers/` = Feature-specific, business logic components
4. **Consistent Structure**: Every feature follows the same folder structure

---

## State Management with Zustand

### Store Architecture: Slice Pattern

The application uses Zustand with a **slice pattern** for modular state management.

#### Store Composition (`store/useStore.ts`)
```typescript
import { create } from 'zustand'
import createNavigationControlSlice, { NavigationControlSlice } from './slices/navigationControlSlice'
import createDashboardSlice, { DashboardSlice } from './slices/dashboardSlice'
import createAuthenticationSlice, { AuthenticationSlice } from './slices/authenticationSlice'
import createRBACSlice, { RBACSlice } from './slices/rbacSlice'

const useStore = create<MyState>()((...a) => ({
  ...createNavigationControlSlice(...a),
  ...createDashboardSlice(...a),
  ...createAuthenticationSlice(...a),
  ...createRBACSlice(...a)
}))

export default useStore
export const useRBAC = () => useStore((state) => state.permissions)

export type MyState = NavigationControlSlice & DashboardSlice & AuthenticationSlice & RBACSlice
```

#### Slice Pattern (`store/slices/authenticationSlice.ts`)
```typescript
import { StateCreator } from 'zustand'
import { MyState } from '@/store'

export type AuthenticationSlice = NonNullable<unknown> & {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  token: string
  setToken: (token: string) => void
  userInfo?: UserInfo
  setUserInfo: (userInfo: UserInfo) => void
}

const createAuthenticationSlice: StateCreator<MyState, [], [], AuthenticationSlice> = (set) => ({
  isAuthenticated: false,
  token: '',
  setToken: (value: string) => set({ token: value }),
  setIsAuthenticated: (value?: boolean) => set(() => ({ isAuthenticated: value })),
  setUserInfo: (userInfo: UserInfo) => set(() => ({ userInfo: userInfo })),
  userInfo: undefined
})

export default createAuthenticationSlice
```

### Zustand Best Practices

1. **Slice Pattern**: Break store into logical slices for modularity
2. **Type Safety**: Export typed slice interfaces and compose them in `MyState`
3. **Selector Hooks**: Create custom selectors for complex state access
   ```typescript
   export const useRBAC = () => useStore((state) => state.permissions)
   ```
4. **Immutable Updates**: Use functional setState for complex updates
5. **No Nested State**: Keep state flat for easier updates
6. **StateCreator Type**: Properly type slices with `StateCreator<MyState, [], [], SliceType>`

### When to Use Zustand vs React Query

- **Zustand**: UI state, authentication, global app settings, navigation state
- **React Query**: Server state, data fetching, caching, synchronization

---

## Coding Conventions

### Code Style Configuration

#### Prettier (`.prettierrc`)
```json
{
  "arrowParens": "always",
  "semi": false,
  "trailingComma": "none",
  "tabWidth": 2,
  "endOfLine": "auto",
  "useTabs": false,
  "singleQuote": true,
  "printWidth": 120,
  "jsxSingleQuote": true
}
```

#### Key Style Rules
- **No semicolons**: `semi: false`
- **Single quotes**: For strings and JSX attributes
- **120 character line width**
- **No trailing commas**
- **Arrow function parens**: Always include
- **2 space indentation**

### TypeScript Configuration

- **Strict mode enabled**: Full type checking
- **Path aliases**: Use `@/*` for imports
  ```typescript
  import { Component } from '@/components/Component'
  ```
- **Module resolution**: `bundler` (supports React Native)

---

## Component Patterns

### 1. Functional Components with TypeScript

```typescript
import React from 'react'

interface Props {
  isLoading?: boolean
}

const BackDrop: React.FC<Props> = ({ isLoading = false }) => {
  if (!isLoading) return null

  return (
    <div className='h-screen w-screen fixed backdrop-blur-xs flex justify-center items-center'>
      <div>
        <RingLoader color={'#a3f0be'} size={60} />
      </div>
    </div>
  )
}

export default BackDrop
```

**Patterns**:
- Use `React.FC<Props>` for component typing
- Define `Props` interface above component
- Default exports for components
- Early returns for conditional rendering
- Default parameter values in destructuring

### 2. Dialog/Modal Components

```typescript
interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
  dialogTitle?: string
  dialogDescription?: string
  confirmBtnLabel?: string
  rejectBtnLabel?: string
  confirmMessage?: string
}

const ConfirmDialog = ({
  open,
  dialogTitle,
  onConfirm,
  confirmBtnLabel,
  rejectBtnLabel,
  onReject,
  onClose,
  dialogDescription,
  confirmMessage
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {!!dialogDescription && <DialogDescription>{dialogDescription}</DialogDescription>}
        </DialogHeader>
        <div className='flex items-center space-x-2 text-foreground'>{confirmMessage}</div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onReject}>
            {rejectBtnLabel || 'Close'}
          </Button>
          <Button type='button' variant='default' onClick={onConfirm}>
            {confirmBtnLabel || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
```

**Patterns**:
- Controlled component pattern (`open`, `onClose`)
- Optional props with fallback values
- Boolean coercion with `!!` for conditional rendering
- Callback props for actions

### 3. List/Table Components

```typescript
'use client'

import { useCallback, useMemo, useState } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { useDataTable } from '@/hooks/use-data-table'
import { useTableQueries } from '@/hooks/useTableQueries'
import { useRBAC } from '@/store/useStore'

const UserGroupList = () => {
  const { page, pageSize, sort } = useTableQueries<User>()
  const [code] = useQueryState('code', parseAsString.withDefault(''))
  const [displayName] = useQueryState('displayName', parseAsString.withDefault(''))
  
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const { canCreateUser, canEditUser, canDeleteUser, canViewUser } = useRBAC()

  const { data: users, isLoading } = useGetUsersByFields({
    query: { page: page - 1, size: pageSize, sort },
    payload: { code, displayName }
  })

  const columns = useMemo(
    () => getUserListColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  )

  const { table } = useDataTable({
    data: users?.data || [],
    columns,
    pageCount: users?.meta.total || 0,
    onRowDoubleClick: handleEdit,
    highlightedRowId: selectedId
  })

  return (
    <Page>
      <BackDrop isLoading={isLoading} />
      <TableHeader headerName='Người dùng' totalItems={users?.meta.count || 0} />
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </Page>
  )
}

export default UserGroupList
```

**Patterns**:
- URL-based filtering with `nuqs`
- Custom hooks for table state (`useTableQueries`, `useDataTable`)
- RBAC checks from Zustand store
- Memoized columns for performance
- Loading states with backdrop
- Double-click row editing

---

## Data Fetching & API

### API Layer Architecture

#### 1. API Caller (`api/apiCaller.ts`)
```typescript
import api from './axios'
import { Method, AxiosRequestConfig } from 'axios'
import qs from 'qs'

const callApi = async <Response, RequestParams = undefined, RequestPayload = undefined>(
  endpoint: string,
  method: Method,
  data?: RequestPayload,
  params?: RequestParams,
  config?: AxiosRequestConfig
): Promise<Response | undefined> => {
  try {
    const res: Response = await api({
      ...config,
      method: method,
      url: `${env.API_BASE_URL}/${endpoint}`,
      data: data,
      params,
      paramsSerializer: (params) => {
        return qs.stringify(params, { arrayFormat: 'repeat' })
      }
    })
    return res
  } catch (err) {
    console.log(err)
    throw err
  }
}

export default callApi
```

**Key Features**:
- Generic type parameters for type-safe API calls
- Centralized error handling
- Query string serialization with `qs`
- Consistent API base URL

### React Query Hooks Pattern

#### 1. Query Hooks (`hooks/useGetUsers.ts`)
```typescript
import { useQuery } from '@tanstack/react-query'
import callApi from '@/api/apiCaller'
import { KMAPP_ENDPOINT } from '@/api/api-endpoints.constants'
import { DataEntry, ListingQuery } from '@/api/types/api-common.types'
import { User } from '@/containers/Users/types/user.types'
import { userQueryKey } from '@/containers/Users/constants/user.query-key'

const useGetUsers = (query?: ListingQuery) => {
  return useQuery({
    queryKey: userQueryKey.getAllUsers(query),
    queryFn: async () => {
      return await callApi<DataEntry<User[], true>, ListingQuery>(
        `${KMAPP_ENDPOINT.user}/all`,
        'get',
        undefined,
        query
      )
    }
  })
}

export default useGetUsers
```

#### 2. Mutation Hooks (`hooks/useCreateUser.ts`)
```typescript
import { useMutation } from '@tanstack/react-query'
import callApi from '@/api/apiCaller'
import { KMAPP_ENDPOINT } from '@/api'
import useHandleErrors from '@/hooks/useHandleErrors'
import { AxiosError } from 'axios'

const useCreateUser = () => {
  const { handleAPIError } = useHandleErrors()
  return useMutation({
    mutationFn: async (createUserPayload: CreateUserPayload) =>
      await callApi(`${KMAPP_ENDPOINT.user}/add`, 'post', createUserPayload),
    onSuccess: () => {},
    onError: (error) => {
      handleAPIError(error as AxiosError)
    }
  })
}

export default useCreateUser
```

#### 3. Query Keys (`constants/user.query-key.ts`)
```typescript
import { ListingQuery } from '@/api'

export const userQueryKey = {
  getAllUsers: (query?: ListingQuery) => ['get-all-users', query],
  getUser: (id: string) => ['get-user', id],
  getUsersByFields: (query?: ListingQuery, payload?: any) => ['get-users-by-fields', query, payload]
}
```

### React Query Best Practices

1. **Dedicated Query Keys**: Create query key objects per feature
2. **Type-Safe Hooks**: Use TypeScript generics for API calls
3. **Error Handling**: Centralized with `useHandleErrors` hook
4. **Default Exports**: Each hook as default export
5. **Naming Convention**: `useGet*`, `useCreate*`, `useUpdate*`, `useDelete*`
6. **Invalidation**: Use query key predicates for cache invalidation
   ```typescript
   await queryClient.invalidateQueries({
     predicate: (query) => query.queryKey[0] === userQueryKey.getUsersByFields()[0]
   })
   ```

---

## Type Safety

### Type Organization

#### 1. Feature Types (`types/user.types.ts`)
```typescript
// Base types for references
export interface BaseUser {
  id: string
}

// Full entity type
export interface User extends BaseUser {
  code: string
  displayName: string
  userName: string
  email: string
  status: UserStatus
  gender: Gender
  roles: Role[]
  department: Department
  building: Building
}

// Create payload (omit server-generated fields)
export interface CreateUserPayload
  extends Omit<User, 'id' | 'department' | 'building'> {
  department?: BaseDepartment
  building?: BaseBuilding
}

// Update payload
export interface UpdateUserPayload extends CreateUserPayload {
  id: string
}

// Delete params
export interface DeleteUsersParams {
  id: string[]
}

// Enums
export enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}
```

**Type Patterns**:
- **Base Types**: Minimal reference types (usually just `id`)
- **Full Types**: Complete entity with all relationships
- **Payload Types**: Use `Omit` to remove server-generated fields
- **Enum Usage**: Prefer string enums for better debugging

#### 2. API Types (`api/types/api-common.types.ts`)
```typescript
export interface DataEntry<T, HasMeta extends boolean = false> {
  data: T
  meta: HasMeta extends true ? PaginationMeta : never
}

export interface PaginationMeta {
  total: number
  count: number
  page: number
  size: number
}

export interface ListingQuery {
  page?: number
  size?: number
  sort?: string[]
}
```

### Type Safety Best Practices

1. **Strict Mode**: Always enable TypeScript strict mode
2. **No `any`**: Avoid `any` type, use `unknown` if needed
3. **Interface over Type**: Use interfaces for object shapes
4. **Type over Enum**: For simple constants, unless enum is clearer
5. **Generic Types**: Use generics for reusable utilities
6. **Discriminated Unions**: For status-based types
7. **Readonly**: Use `readonly` for immutable data

---

## File Naming Conventions

### Component Files
- **Format**: `PascalCase.tsx`
- **Examples**: `UserList.tsx`, `BackDrop.tsx`, `ConfirmDialog.tsx`
- **Export**: Default export with same name as file

### Hook Files
- **Format**: `camelCase.ts` with `use` prefix
- **Examples**: `useGetUsers.ts`, `useCreateUser.ts`, `useDataTable.ts`
- **Export**: Default export

### Constant Files
- **Format**: `kebab-case.constants.ts`
- **Examples**: `user.query-key.ts`, `api-endpoints.constants.ts`
- **Export**: Named exports

### Type Files
- **Format**: `kebab-case.types.ts`
- **Examples**: `user.types.ts`, `budget.types.ts`
- **Export**: Named exports (interfaces, types, enums)

### Utility Files
- **Format**: `camelCase.ts`
- **Examples**: `formatCurrency.ts`, `downloadFile.ts`
- **Export**: Named exports

### Index Files
- **Purpose**: Re-export module contents
- **Pattern**: 
  ```typescript
  export * from './ComponentName'
  export { default } from './ComponentName'
  ```

---

## Additional Best Practices

### 1. Custom Hooks

```typescript
// Simple data fetch hook
export const useGetFetchQuery = (key: string) => {
  const queryClient = useQueryClient()
  return queryClient.getQueryData([key])
}
```

### 2. Utility Functions

```typescript
// Prefer named exports
export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
}

export function uppercaseFirstLetter(str: string) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
```

### 3. Path Aliases

Always use path aliases for cleaner imports:
```typescript
// ✅ Good
import { User } from '@/containers/Users/types/user.types'
import { useStore } from '@/store'

// ❌ Bad
import { User } from '../../../containers/Users/types/user.types'
```

### 4. Component Exports

```typescript
// Component file
const UserList = () => {
  // ...
}

export default UserList

// index.ts
export { default } from './UserList'
export { default as UserList } from './UserList'
```

### 5. RBAC Pattern

```typescript
const { canCreateUser, canEditUser, canDeleteUser, canViewUser } = useRBAC()

return (
  <>
    {canCreateUser && <Button>Create</Button>}
    {canViewUser && <UserList />}
  </>
)
```

---

## Adapting for React Native

When adapting this codebase to React Native:

1. **Navigation**: Replace Next.js routing with React Navigation
2. **Styling**: Replace Tailwind with StyleSheet or styled-components
3. **Components**: Replace web components with React Native equivalents
4. **Keep**: 
   - Folder structure
   - Zustand state management
   - React Query data fetching
   - TypeScript patterns
   - Hook patterns
   - API layer architecture

---

## Summary

This codebase follows a **feature-based architecture** with:
- **Modular state management** using Zustand slices
- **Type-safe API layer** with React Query
- **Consistent folder structure** per feature
- **RBAC-driven UI** with permission-based rendering
- **Co-located code** keeping related files together
- **Strong TypeScript** usage throughout
- **Clean code principles** with Prettier/ESLint

The patterns are framework-agnostic and can be easily adapted to React Native projects while maintaining the same architectural principles.
