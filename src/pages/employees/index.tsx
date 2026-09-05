import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "@/lib/api/employees.api";
import { createUser } from "@/lib/api/users.api";
import { getDesignations } from "@/lib/api/designations.api";
import type {
  Employee,
  EmployeeStatus,
  EmploymentType,
  Gender,
} from "@/lib/types/employee";

import {
  LIMITS,
  firstError,
  onlyCode,
  onlyDigits,
  onlyName,
  onlyUsername,
  trimMax,
  validateEmail,
  validateMaxLength,
  validateName,
  validatePhone,
  validateRequired,
} from "@/lib/input-restrictions";

type Designation = {
  id: string;
  title: string;
  category: string;
};

type EmployeeForm = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | "";
  designationId: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  phone: string;
  address: string;
  status: EmployeeStatus;
  createUser: boolean;
  username: string;
  email: string;
  userPhone: string;
  password: string;
};

const initialForm: EmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  designationId: "",
  dateOfJoining: "",
  employmentType: "FULL_TIME",
  phone: "",
  address: "",
  status: "ACTIVE",
  createUser: false,
  username: "",
  email: "",
  userPhone: "",
  password: "",
};

export default function EmployeesPage() {
  const { accessToken } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  async function loadData() {
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [employeeData, designationData] = await Promise.all([
        getEmployees(accessToken),
        getDesignations(accessToken),
      ]);

      setEmployees(employeeData);
      setDesignations(designationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEmployee(null);
    setForm({
      ...initialForm,
      dateOfJoining: new Date().toISOString().split("T")[0],
    });
    setError("");
    setShowModal(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setForm({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      dateOfBirth: employee.dateOfBirth
        ? employee.dateOfBirth.split("T")[0]
        : "",
      gender: employee.gender || "",
      designationId: employee.designationId || "",
      dateOfJoining: employee.dateOfJoining
        ? employee.dateOfJoining.split("T")[0]
        : "",
      employmentType: employee.employmentType,
      phone: employee.phone,
      address: employee.address || "",
      status: employee.status,
      createUser: false,
      username: employee.user?.username || "",
      email: employee.user?.email || "",
      userPhone: employee.user?.phone || "",
      password: "",
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployee(null);
    setForm(initialForm);
    setError("");
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    let next = value;

    switch (name) {
      case "employeeCode":
        next = onlyCode(value, LIMITS.CODE_MAX);
        break;
      case "firstName":
      case "lastName":
        next = onlyName(value, LIMITS.NAME_MAX);
        break;
      case "phone":
      case "userPhone":
        next = onlyDigits(value, LIMITS.PHONE_MAX);
        break;
      case "username":
        next = onlyUsername(value, LIMITS.USERNAME_MAX);
        break;
      case "email":
        next = trimMax(value, LIMITS.EMAIL_MAX);
        break;
      case "address":
        next = trimMax(value, LIMITS.ADDRESS_MAX);
        break;
      case "password":
        next = trimMax(value, LIMITS.TEXT_MAX);
        break;
    }

    setForm((previous) => ({
      ...previous,
      [name]: next,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    const validationError = firstError(
      validateRequired(form.employeeCode, "Employee code"),
      validateMaxLength(
        form.employeeCode,
        "Employee code",
        LIMITS.CODE_MAX,
      ),
      validateRequired(form.firstName, "First name"),
      validateName(form.firstName, "First name"),
      validateName(form.lastName, "Last name"),
      validateRequired(form.phone, "Phone number"),
      validatePhone(form.phone, "Phone number"),
      validateMaxLength(form.address, "Address", LIMITS.ADDRESS_MAX),
      validateMaxLength(form.email, "Email", LIMITS.EMAIL_MAX),
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    if (form.createUser) {
      const userError = firstError(
        validateRequired(form.username, "Username"),
        validateMaxLength(
          form.username,
          "Username",
          LIMITS.USERNAME_MAX,
        ),
        validateRequired(form.password, "Password"),
        validateMaxLength(form.password, "Password", LIMITS.TEXT_MAX),
      );

      if (userError) {
        setError(userError);
        return;
      }

      if (form.email.trim() && !validateEmail(form.email)) {
        setError(validateEmail(form.email));
        return;
      }

      if (form.userPhone.trim() && !validatePhone(form.userPhone)) {
        setError(validatePhone(form.userPhone));
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const employeePayload = {
        employeeCode: form.employeeCode,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        designationId: form.designationId || undefined,
        dateOfJoining: form.dateOfJoining,
        employmentType: form.employmentType,
        phone: form.phone,
        address: form.address || undefined,
        status: form.status,
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeePayload, accessToken);
      } else {
        const employee = await createEmployee(employeePayload, accessToken);

        if (form.createUser) {
          const user = await createUser(
            {
              username: form.username,
              email: form.email || undefined,
              phone: form.userPhone || undefined,
              password: form.password,
              userType: "EMPLOYEE",
            },
            accessToken,
          );

          await updateEmployee(
            employee.id,
            {
              userId: user.id,
            },
            accessToken,
          );
        }
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) {
      setError("Unauthorized");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      setError("");
      await deleteEmployee(id, accessToken);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete employee",
      );
    }
  }

  function getDesignationName(designationId: string | null) {
    if (!designationId) {
      return "-";
    }

    const designation = designations.find((item) => item.id === designationId);

    return designation?.title || "-";
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage school employees and optional login access.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Create Employee
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Employee Code</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Login</th>
              <th className="px-4 py-3 text-left">Designation</th>
              <th className="px-4 py-3 text-left">Employment Type</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{employee.employeeCode}</td>

                  <td className="px-4 py-3">
                    {employee.firstName} {employee.lastName}
                  </td>

                  <td className="px-4 py-3">
                    {employee.user ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Login Enabled
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        No Login
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {employee.designation?.title ||
                      getDesignationName(employee.designationId)}
                  </td>

                  <td className="px-4 py-3">{employee.employmentType}</td>

                  <td className="px-4 py-3">{employee.phone}</td>

                  <td className="px-4 py-3">{employee.status}</td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setViewEmployee(employee)}
                      className="mr-2 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(employee)}
                      className="mr-2 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(employee.id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingEmployee ? "Edit Employee" : "Create Employee"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingEmployee
                    ? "Update employee information."
                    : "Create the employee first, then optionally create login credentials."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-xl text-gray-500 hover:text-black"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <h3 className="mb-4 text-lg font-medium">Employee Information</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Employee Code</span>
                  <input
                    name="employeeCode"
                    value={form.employeeCode}
                    onChange={handleChange}
                    required
                    maxLength={LIMITS.CODE_MAX}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">First Name</span>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    maxLength={LIMITS.NAME_MAX}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Last Name</span>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    maxLength={LIMITS.NAME_MAX}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Date of Birth</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Gender</span>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Designation</span>
                  <select
                    name="designationId"
                    value={form.designationId}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation) => (
                      <option key={designation.id} value={designation.id}>
                        {designation.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Date of Joining</span>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={form.dateOfJoining}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Employment Type</span>
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Phone</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={LIMITS.PHONE_MAX}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-medium">Address</span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  maxLength={LIMITS.ADDRESS_MAX}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </label>

              {!editingEmployee && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Login Credentials</h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Does this employee need a login account?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          createUser: !previous.createUser,
                        }))
                      }
                      className={`rounded-md px-4 py-2 ${
                        form.createUser
                          ? "bg-blue-600 text-white"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      {form.createUser ? "Yes" : "No"}
                    </button>
                  </div>

                  {form.createUser && (
                    <div className="mt-4 rounded-md border bg-gray-50 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium">Username</span>

                          <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            maxLength={LIMITS.USERNAME_MAX}
                            className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Email</span>

                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            maxLength={LIMITS.EMAIL_MAX}
                            className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">
                            Login Phone
                          </span>

                          <input
                            name="userPhone"
                            value={form.userPhone}
                            onChange={handleChange}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={LIMITS.PHONE_MAX}
                            className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Password</span>

                          <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            maxLength={LIMITS.TEXT_MAX}
                            className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                          />
                        </label>
                      </div>

                      <p className="mt-3 text-sm text-gray-500">
                        User type: EMPLOYEE
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingEmployee
                      ? "Update Employee"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Employee Details</h2>

              <button
                type="button"
                onClick={() => setViewEmployee(null)}
                className="text-xl text-gray-500 hover:text-black"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <strong>Employee Code:</strong> {viewEmployee.employeeCode}
              </p>

              <p>
                <strong>Name:</strong> {viewEmployee.firstName}{" "}
                {viewEmployee.lastName}
              </p>

              <p>
                <strong>Date of Birth:</strong>{" "}
                {viewEmployee.dateOfBirth
                  ? viewEmployee.dateOfBirth.split("T")[0]
                  : "-"}
              </p>

              <p>
                <strong>Gender:</strong> {viewEmployee.gender || "-"}
              </p>

              <p>
                <strong>Designation:</strong>{" "}
                {viewEmployee.designation?.title ||
                  getDesignationName(viewEmployee.designationId)}
              </p>

              <p>
                <strong>Date of Joining:</strong>{" "}
                {viewEmployee.dateOfJoining
                  ? viewEmployee.dateOfJoining.split("T")[0]
                  : "-"}
              </p>

              <p>
                <strong>Employment Type:</strong> {viewEmployee.employmentType}
              </p>

              <p>
                <strong>Phone:</strong> {viewEmployee.phone}
              </p>

              <p>
                <strong>Address:</strong> {viewEmployee.address || "-"}
              </p>

              <p>
                <strong>Status:</strong> {viewEmployee.status}
              </p>

              <p>
                <strong>Login:</strong>{" "}
                {viewEmployee.user?.username || "No Login"}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewEmployee(null)}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
