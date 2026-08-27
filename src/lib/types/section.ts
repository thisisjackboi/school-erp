export interface Section {
    id: string;
  
    classId: string;
  
    academicSessionId: string;
  
    name: string;
  
    capacity: number | null;
  
    classTeacherEmployeeId: string | null;
  
    createdAt: string;
  
    updatedAt: string;
  
    class: {
      id: string;
      name: string;
      displayOrder: number;
      createdAt: string;
      updatedAt: string;
    };
  
    academicSession: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }