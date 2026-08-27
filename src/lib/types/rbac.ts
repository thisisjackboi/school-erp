export interface RbacUser {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    userType: string;
    isActive: boolean;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystemRole: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Permission {
    id: string;
    code: string;
    module: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
  }