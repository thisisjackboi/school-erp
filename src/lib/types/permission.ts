export interface Permission {
    id: string;
    code: string;
    module: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PermissionListMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
  
  export interface PermissionListResponse {
    items: Permission[];
    meta: PermissionListMeta;
  }