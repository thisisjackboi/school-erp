import type {
  MissingStructureEmployee,
  PayrollLine,
  PayrollRegister,
  PayrollRegisterGroup,
  PayrollRun,
  PayrollRunItem,
  PayrollRunStatus,
  SalaryComponent,
  SalaryComponentType,
  SalaryStructure,
  SalaryStructureItem,
} from "../types/payroll";

/**
 * Prisma serializes `Decimal` columns as strings, so every money field arrives
 * as a string even though the domain treats it as a number. All coercion is
 * done once, here, at the API boundary.
 */
export function num(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lines(value: unknown): PayrollLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((line) => {
    const entry = line as Partial<PayrollLine>;
    return {
      componentId: entry.componentId ?? null,
      name: typeof entry.name === "string" ? entry.name : "-",
      amount: num(entry.amount),
    };
  });
}

function employeeRef(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, any>;
  return {
    id: String(raw.id ?? ""),
    employeeCode: String(raw.employeeCode ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    ...(raw.employmentType ? { employmentType: String(raw.employmentType) } : {}),
    ...(raw.status ? { status: String(raw.status) } : {}),
    designation: raw.designation
      ? {
          id: String(raw.designation.id ?? ""),
          title: String(raw.designation.title ?? ""),
          category: raw.designation.category ?? null,
        }
      : null,
  };
}

export function toPayrollRun(raw: unknown): PayrollRun {
  const run = (raw ?? {}) as Record<string, any>;
  return {
    id: String(run.id ?? ""),
    periodMonth: num(run.periodMonth),
    periodYear: num(run.periodYear),
    status: (run.status ?? "DRAFT") as PayrollRunStatus,
    totalGross: num(run.totalGross),
    totalDeductions: num(run.totalDeductions),
    totalNet: num(run.totalNet),
    employeeCount: num(run.employeeCount),
    paymentMethod: run.paymentMethod ?? null,
    paymentReference: run.paymentReference ?? null,
    notes: run.notes ?? null,
    processedAt: run.processedAt ?? null,
    approvedAt: run.approvedAt ?? null,
    paidAt: run.paidAt ?? null,
    processedByUserId: run.processedByUserId ?? null,
    approvedByUserId: run.approvedByUserId ?? null,
    createdAt: run.createdAt ?? "",
    updatedAt: run.updatedAt ?? "",
    ...(Array.isArray(run.items)
      ? { items: run.items.map(toPayrollRunItem) }
      : {}),
  };
}

export function toPayrollRunItem(raw: unknown): PayrollRunItem {
  const item = (raw ?? {}) as Record<string, any>;
  return {
    id: String(item.id ?? ""),
    runId: String(item.runId ?? ""),
    employeeId: String(item.employeeId ?? ""),
    salaryStructureId: String(item.salaryStructureId ?? ""),
    ctc: num(item.ctc),
    basicSalary: num(item.basicSalary),
    workingDays: num(item.workingDays),
    paidDays: num(item.paidDays),
    lopDays: num(item.lopDays),
    grossAmount: num(item.grossAmount),
    lopAmount: num(item.lopAmount),
    totalDeductions: num(item.totalDeductions),
    netAmount: num(item.netAmount),
    earnings: lines(item.earnings),
    deductions: lines(item.deductions),
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
    employee: employeeRef(item.employee),
    salaryStructure: item.salaryStructure
      ? {
          id: String(item.salaryStructure.id ?? ""),
          effectiveFrom: item.salaryStructure.effectiveFrom ?? "",
          ctc: num(item.salaryStructure.ctc),
          basicSalary: num(item.salaryStructure.basicSalary),
        }
      : null,
  };
}

export function toSalaryComponent(raw: unknown): SalaryComponent {
  const component = (raw ?? {}) as Record<string, any>;
  return {
    id: String(component.id ?? ""),
    code: String(component.code ?? ""),
    name: String(component.name ?? ""),
    type: (component.type ?? "EARNING") as SalaryComponentType,
    description: component.description ?? null,
    isActive: component.isActive !== false,
    createdAt: component.createdAt ?? "",
    updatedAt: component.updatedAt ?? "",
  };
}

export function toSalaryStructureItem(raw: unknown): SalaryStructureItem {
  const item = (raw ?? {}) as Record<string, any>;
  return {
    id: String(item.id ?? ""),
    salaryStructureId: String(item.salaryStructureId ?? ""),
    componentId: item.componentId ?? null,
    customName: String(item.customName ?? ""),
    type: (item.type ?? "EARNING") as SalaryComponentType,
    amount: num(item.amount),
  };
}

export function toSalaryStructure(raw: unknown): SalaryStructure {
  const structure = (raw ?? {}) as Record<string, any>;
  return {
    id: String(structure.id ?? ""),
    employeeId: String(structure.employeeId ?? ""),
    ctc: num(structure.ctc),
    basicSalary: num(structure.basicSalary),
    effectiveFrom: structure.effectiveFrom ?? "",
    effectiveTo: structure.effectiveTo ?? null,
    notes: structure.notes ?? null,
    createdAt: structure.createdAt ?? "",
    updatedAt: structure.updatedAt ?? "",
    employee: employeeRef(structure.employee),
    ...(Array.isArray(structure.items)
      ? { items: structure.items.map(toSalaryStructureItem) }
      : {}),
  };
}

export function toMissingStructureEmployees(
  raw: unknown,
): MissingStructureEmployee[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const row = (entry ?? {}) as Record<string, any>;
    return {
      id: String(row.id ?? ""),
      employeeCode: String(row.employeeCode ?? ""),
      firstName: String(row.firstName ?? ""),
      lastName: String(row.lastName ?? ""),
      ...(row.employmentType ? { employmentType: String(row.employmentType) } : {}),
      designation: row.designation
        ? { title: String(row.designation.title ?? "") }
        : null,
    };
  });
}

export function toPayrollRegister(raw: unknown): PayrollRegister {
  const register = (raw ?? {}) as Record<string, any>;
  const departments: PayrollRegisterGroup[] = Array.isArray(
    register.departments,
  )
    ? register.departments.map((group: Record<string, any>) => ({
        category: String(group.category ?? "Unassigned"),
        employeeCount: num(group.employeeCount),
        gross: num(group.gross),
        deductions: num(group.deductions),
        net: num(group.net),
      }))
    : [];

  return {
    run: toPayrollRun(register.run),
    departments,
  };
}