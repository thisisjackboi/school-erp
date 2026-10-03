import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { getEmployees } from "@/lib/api/employees.api";
import {
  approvePayroll,
  discardPayrollRun,
  generatePayroll,
  listPayrollRuns,
  markPayrollPaid,
  processPayroll,
  updatePayrollRunItem,
  unprocessPayroll,
  unapprovePayroll,
} from "@/lib/api/payroll.api";
import {
  createSalaryComponent,
  createSalaryStructure,
  deleteSalaryComponent,
  deleteSalaryStructure,
  listEmployeesWithoutStructure,
  listSalaryComponents,
  listSalaryStructures,
  updateSalaryComponent,
  updateSalaryStructure,
} from "@/lib/api/salary-structures.api";

import type {
  CreateSalaryComponentPayload,
  CreateSalaryStructurePayload,
  GeneratePayrollPayload,
  GeneratePayrollResult,
  MarkPayrollPaidPayload,
  MissingStructureEmployee,
  PayrollRun,
  SalaryComponent,
  SalaryStructure,
  UpdatePayrollRunItemPayload,
  UpdateSalaryComponentPayload,
  UpdateSalaryStructurePayload,
} from "@/lib/types/payroll";

import type { PayrollEmployee } from "./types";

interface PayrollModuleContextValue {
  loading: boolean;
  reloading: boolean;
  error: string | null;

  runs: PayrollRun[];
  components: SalaryComponent[];
  structures: SalaryStructure[];
  missingStructures: MissingStructureEmployee[];
  employees: PayrollEmployee[];

  reload: () => Promise<void>;

  // payroll runs
  generateRun: (payload: GeneratePayrollPayload) => Promise<GeneratePayrollResult>;
  processRun: (runId: string) => Promise<PayrollRun>;
  unprocessRun: (runId: string) => Promise<PayrollRun>;
  approveRun: (runId: string) => Promise<PayrollRun>;
  unapproveRun: (runId: string) => Promise<PayrollRun>;
  payRun: (
    runId: string,
    payload: MarkPayrollPaidPayload,
  ) => Promise<PayrollRun>;
  discardRun: (runId: string) => Promise<void>;
  updateRunItem: (
    runId: string,
    itemId: string,
    payload: UpdatePayrollRunItemPayload,
  ) => Promise<PayrollRun>;

  // salary components
  addComponent: (payload: CreateSalaryComponentPayload) => Promise<void>;
  editComponent: (
    id: string,
    payload: UpdateSalaryComponentPayload,
  ) => Promise<void>;
  removeComponent: (id: string) => Promise<void>;

  // salary structures
  addStructure: (payload: CreateSalaryStructurePayload) => Promise<void>;
  editStructure: (
    id: string,
    payload: UpdateSalaryStructurePayload,
  ) => Promise<void>;
  removeStructure: (id: string) => Promise<void>;
}

const PayrollModuleContext = createContext<PayrollModuleContextValue | undefined>(
  undefined,
);

export function PayrollModuleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [missingStructures, setMissingStructures] = useState<
    MissingStructureEmployee[]
  >([]);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    setLoading(true);
    setReloading(true);

    try {
      // Each slice is independent: a user may hold payroll.read without any
      // salary-structure permission, and that must not blank the whole module.
      const [runList, componentList, structureList, missingList, employeeList] =
        await Promise.all([
          listPayrollRuns({}, accessToken).catch(() => [] as PayrollRun[]),
          listSalaryComponents(accessToken, true).catch(
            () => [] as SalaryComponent[],
          ),
          listSalaryStructures(accessToken).catch(
            () => [] as SalaryStructure[],
          ),
          listEmployeesWithoutStructure(accessToken).catch(
            () => [] as MissingStructureEmployee[],
          ),
          getEmployees(accessToken).catch(() => []),
        ]);

      setRuns(runList);
      setComponents(componentList);
      setStructures(structureList);
      setMissingStructures(missingList);
      setEmployees(
        employeeList
          .filter((employee) => !employee.deletedAt)
          .map((employee) => ({
            ...employee,
            fullName:
              `${employee.firstName} ${employee.lastName}`.trim() ||
              employee.employeeCode,
          })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payroll data");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [accessToken]);

  // Re-initialize whenever the token changes so a different signed-in user
  // never sees the previous user's payroll data.
  const initializedToken = useRef<string | null>(null);
  useEffect(() => {
    if (!accessToken) {
      initializedToken.current = null;
      return;
    }

    if (initializedToken.current === accessToken) return;

    initializedToken.current = accessToken;
    setLoading(true);
    setRuns([]);
    setComponents([]);
    setStructures([]);
    setMissingStructures([]);
    setEmployees([]);
    void reload();
  }, [accessToken, reload]);

  /** Refresh only the run list; used by every workflow action. */
  const reloadRuns = useCallback(async () => {
    if (!accessToken) return;
    const list = await listPayrollRuns({}, accessToken).catch(
      () => [] as PayrollRun[],
    );
    setRuns(list);
  }, [accessToken]);

  const reloadComponents = useCallback(async () => {
    if (!accessToken) return;
    const list = await listSalaryComponents(accessToken, true).catch(
      () => [] as SalaryComponent[],
    );
    setComponents(list);
  }, [accessToken]);

  const reloadStructures = useCallback(async () => {
    if (!accessToken) return;
    const [structureList, missingList] = await Promise.all([
      listSalaryStructures(accessToken).catch(() => [] as SalaryStructure[]),
      listEmployeesWithoutStructure(accessToken).catch(
        () => [] as MissingStructureEmployee[],
      ),
    ]);
    setStructures(structureList);
    setMissingStructures(missingList);
  }, [accessToken]);

  const generateRun = useCallback(
    async (payload: GeneratePayrollPayload) => {
      const result = await generatePayroll(payload, accessToken);
      await reloadRuns();
      return result;
    },
    [accessToken, reloadRuns],
  );

  const processRun = useCallback(
    async (runId: string) => {
      const run = await processPayroll(runId, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const approveRun = useCallback(
    async (runId: string) => {
      const run = await approvePayroll(runId, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const unprocessRun = useCallback(
    async (runId: string) => {
      const run = await unprocessPayroll(runId, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const unapproveRun = useCallback(
    async (runId: string) => {
      const run = await unapprovePayroll(runId, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const payRun = useCallback(
    async (runId: string, payload: MarkPayrollPaidPayload) => {
      const run = await markPayrollPaid(runId, payload, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const discardRun = useCallback(
    async (runId: string) => {
      await discardPayrollRun(runId, accessToken);
      await reloadRuns();
    },
    [accessToken, reloadRuns],
  );

  const updateRunItem = useCallback(
    async (
      runId: string,
      itemId: string,
      payload: UpdatePayrollRunItemPayload,
    ) => {
      const run = await updatePayrollRunItem(runId, itemId, payload, accessToken);
      await reloadRuns();
      return run;
    },
    [accessToken, reloadRuns],
  );

  const addComponent = useCallback(
    async (payload: CreateSalaryComponentPayload) => {
      await createSalaryComponent(payload, accessToken);
      await reloadComponents();
    },
    [accessToken, reloadComponents],
  );

  const editComponent = useCallback(
    async (id: string, payload: UpdateSalaryComponentPayload) => {
      await updateSalaryComponent(id, payload, accessToken);
      await reloadComponents();
    },
    [accessToken, reloadComponents],
  );

  const removeComponent = useCallback(
    async (id: string) => {
      await deleteSalaryComponent(id, accessToken);
      await reloadComponents();
    },
    [accessToken, reloadComponents],
  );

  const addStructure = useCallback(
    async (payload: CreateSalaryStructurePayload) => {
      await createSalaryStructure(payload, accessToken);
      await reloadStructures();
    },
    [accessToken, reloadStructures],
  );

  const editStructure = useCallback(
    async (id: string, payload: UpdateSalaryStructurePayload) => {
      await updateSalaryStructure(id, payload, accessToken);
      await reloadStructures();
    },
    [accessToken, reloadStructures],
  );

  const removeStructure = useCallback(
    async (id: string) => {
      await deleteSalaryStructure(id, accessToken);
      await reloadStructures();
    },
    [accessToken, reloadStructures],
  );

  const value: PayrollModuleContextValue = useMemo(
    () => ({
      loading,
      reloading,
      error,
      runs,
      components,
      structures,
      missingStructures,
      employees,
      reload,
      generateRun,
      processRun,
      unprocessRun,
      approveRun,
      unapproveRun,
      payRun,
      discardRun,
      updateRunItem,
      addComponent,
      editComponent,
      removeComponent,
      addStructure,
      editStructure,
      removeStructure,
    }),
    [
      loading,
      reloading,
      error,
      runs,
      components,
      structures,
      missingStructures,
      employees,
      reload,
      generateRun,
      processRun,
      unprocessRun,
      approveRun,
      unapproveRun,
      payRun,
      discardRun,
      updateRunItem,
      addComponent,
      editComponent,
      removeComponent,
      addStructure,
      editStructure,
      removeStructure,
    ],
  );

  return (
    <PayrollModuleContext.Provider value={value}>
      {children}
    </PayrollModuleContext.Provider>
  );
}

export function usePayroll(): PayrollModuleContextValue {
  const context = useContext(PayrollModuleContext);
  if (!context) {
    throw new Error("usePayroll must be used within PayrollModuleProvider");
  }
  return context;
}