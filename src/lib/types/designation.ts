export type DesignationCategory = "TEACHING" | "ADMINISTRATIVE" | "SUPPORT";

export interface Designation {
  id: string;
  title: string;
  category: DesignationCategory;
  createdAt: string;
  updatedAt: string;
}
