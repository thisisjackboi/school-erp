import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Users,
  BadgeIndianRupee,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFees } from "@/lib/fees-fm/store";
import { useFeeAccess } from "@/lib/fees-fm/access";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { uid } from "@/lib/fees-fm/seed";
import type { FeeCategory, FeeStructure, FeeStructureItem, RecurringInterval } from "@/lib/fees-fm/types";

export default function FeeSetupPage() {
  const {
    categories, addCategory, updateCategory, saveStructure, assignStructureToClass,
    state, studentsInClass, session, generateForClass, classes,
  } = useFees();
  const structures = state.structures;
  const { canManage } = useFeeAccess();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState("");
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // category form state
  const [catForm, setCatForm] = useState<Omit<FeeCategory, "id">>({
    name: "",
    code: "",
    description: "",
    isRecurring: true,
    recurringInterval: "MONTHLY",
    isOptional: false,
    isAddOn: false,
    isActive: true,
  });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const structureFor = (className: string) =>
    structures.find((s) => s.className === className && s.academicSessionId === session?.id);

  // local editable structure draft
  const [draft, setDraft] = useState<FeeStructure | null>(null);

  useEffect(() => {
    if (!selectedClass) {
      setDraft(null);
      return;
    }
    const existing = structureFor(selectedClass);
    if (existing) {
      setDraft(JSON.parse(JSON.stringify(existing)));
    } else {
      setDraft({
        id: `struct_draft_${selectedClass.replace(/\W/g, "")}`,
        name: `${selectedClass} · ${session?.name || ""}`,
        academicSessionId: session?.id || "",
        classId: classes.find((c) => c.name === selectedClass)?.id || `cls_${selectedClass.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        className: selectedClass,
        isActive: true,
        items: [],
        createdAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, structures, session?.id]);

  const itemTotalMonthly = useMemo(
    () =>
      (draft?.items || [])
        .filter((i) => {
          const cat = categories.find((c) => c.id === i.feeCategoryId);
          return cat?.recurringInterval === "MONTHLY";
        })
        .reduce((s, i) => s + i.amount, 0),
    [draft, categories],
  );

  const updateItem = (itemId: string, patch: Partial<FeeStructureItem>) => {
    setDraft((prev) =>
      prev ? { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : prev,
    );
  };

  const addItemToDraft = (categoryId: string, amount: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setDraft((prev) => {
      if (!prev) return prev;
      if (prev.items.some((i) => i.feeCategoryId === categoryId)) {
        toast("Duplicate", "This fee head is already in the structure.", "error");
        return prev;
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: uid("item"),
            feeCategoryId: categoryId,
            categoryName: cat.name,
            amount,
            dueDay: 10,
            lateFeeAmount: cat.recurringInterval === "ONCE" ? 0 : 100,
            gracePeriodDays: 7,
            proratable: cat.recurringInterval === "MONTHLY",
            isAddOn: cat.isAddOn,
          },
        ],
      };
    });
    setAddItemOpen(false);
  };

  const handleSaveStructure = () => {
    if (!draft || draft.items.length === 0) {
      toast("Error", "Add at least one fee head to the structure.", "error");
      return;
    }
    saveStructure(draft);
    toast("Structure saved", `${draft.className} fee structure saved.`, "success");
  };

  const handleAssign = () => {
    if (!draft) return;
    handleSaveStructure();
    const classId = classes.find((c) => c.name === draft.className)?.id;
    const targetStudents = studentsInClass(draft.className, classId);
    if (!targetStudents.length) {
      toast("No students", `${draft.className} has no enrolled students.`, "info");
      return;
    }
    assignStructureToClass(draft.className, draft.id);
    generateForClass(draft.className, classId);
    toast("Assignments created", `Applied ${draft.className} structure to ${targetStudents.length} student(s).`, "success");
  };

  const resetToExisting = () => {
    const existing = structureFor(selectedClass);
    if (existing) setDraft(JSON.parse(JSON.stringify(existing)));
  };

  const openCatEditor = (cat?: FeeCategory) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatForm({
        name: cat.name,
        code: cat.code,
        description: cat.description || "",
        isRecurring: cat.isRecurring,
        recurringInterval: cat.recurringInterval,
        isOptional: cat.isOptional,
        isAddOn: cat.isAddOn,
        isActive: cat.isActive,
      });
    } else {
      setEditingCatId(null);
      setCatForm({
        name: "",
        code: "",
        description: "",
        isRecurring: true,
        recurringInterval: "MONTHLY",
        isOptional: false,
        isAddOn: false,
        isActive: true,
      });
    }
    setNewCatOpen(true);
  };

  const handleSaveCategory = () => {
    if (!catForm.name.trim() || !catForm.code.trim()) {
      toast("Error", "Fee head name and code are required.", "error");
      return;
    }
    if (editingCatId) {
      updateCategory({ ...catForm, id: editingCatId } as FeeCategory);
      toast("Fee head updated", `${catForm.name} updated.`, "success");
    } else {
      addCategory({ ...catForm, id: uid("cat") });
      toast("Fee head added", `${catForm.name} added. Set it in class structures to use it.`, "success");
    }
    setNewCatOpen(false);
  };

  if (!canManage) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <Lock className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fee Setup is restricted</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Only admins and accountants can create fee heads and assign class-wise fee structures.
            </p>
          </CardContent>
        </Card>
        <ReadOnlyStructureOverview structures={structures} classes={classes} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fee heads / categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Fee Heads (set up once)</CardTitle>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => openCatEditor()}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No fee heads yet</TableCell></TableRow>
                )}
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground block text-[10px] font-mono">{c.code}</span>
                    </TableCell>
                    <TableCell className="text-xs">{c.recurringInterval.toLowerCase()}</TableCell>
                    <TableCell className="text-xs text-center">
                      {c.isAddOn ? <span className="text-blue-600 font-semibold">Add-on</span> : c.isOptional ? <span className="text-amber-600 font-semibold">Optional</span> : <span className="text-emerald-600 font-semibold">Required</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCatEditor(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { /* soft deactivate instead of delete */ }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Class-wise structure assignment */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-600" /> Class-wise Fee Structure
            </CardTitle>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select a class…</option>
              {Array.from(new Set(classes.map((c) => c.name))).sort((a, b) => a.localeCompare(b)).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {!draft ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Pick a class to view or create its annual fee structure.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 text-xs">
                  <span className="font-semibold">
                    {draft.name} {draft.isActive && <span className="text-emerald-600 ml-1">(Active)</span>}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={resetToExisting}>
                    <RefreshCw className="mr-1 h-3 w-3" /> Reset
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Head</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Due Day</TableHead>
                      <TableHead className="text-center">Grace (days)</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-center">Prorata</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draft.items.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No fee heads assigned to this class yet</TableCell></TableRow>
                    ) : (
                      draft.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs font-medium">
                            {item.categoryName}
                            {item.isAddOn && <span className="text-blue-600 text-[10px] ml-1">add-on</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input type="number" className="h-7 w-28 ml-auto text-xs text-right tabular-nums" value={item.amount} onChange={(e) => updateItem(item.id, { amount: Number(e.target.value) })} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" className="h-7 w-16 text-xs text-center" value={item.dueDay} onChange={(e) => updateItem(item.id, { dueDay: Number(e.target.value) })} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input type="number" className="h-7 w-16 text-xs text-center" value={item.gracePeriodDays} onChange={(e) => updateItem(item.id, { gracePeriodDays: Number(e.target.value) })} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input type="number" className="h-7 w-24 ml-auto text-xs text-right tabular-nums" value={item.lateFeeAmount} onChange={(e) => updateItem(item.id, { lateFeeAmount: Number(e.target.value) })} />
                          </TableCell>
                          <TableCell className="text-center">
                            <input type="checkbox" className="accent-blue-600" checked={item.proratable} onChange={(e) => updateItem(item.id, { proratable: e.target.checked })} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDraft((p) => (p ? { ...p, items: p.items.filter((i) => i.id !== item.id) } : p))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setAddItemOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Fee Head
                  </Button>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Monthly core total: <strong>{formatCurrency(itemTotalMonthly)}</strong>
                      {draft.items.length > 0 && ` · ${draft.items.length} head(s)`}
                    </span>
                    <Button size="sm" variant="outline" className="text-xs" onClick={handleSaveStructure}>
                      <Save className="mr-1 h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={handleAssign}>
                      <Users className="mr-1 h-3.5 w-3.5" /> Assign to {selectedClass} ({studentsInClass(selectedClass, classes.find((c) => c.name === selectedClass)?.id).length})
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Structures overview */}
      <ReadOnlyStructureOverview structures={structures} classes={classes} extra={<BadgeIndianRupee className="h-4 w-4 text-blue-600" />} />

      {/* Add item dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogHeader>
          <DialogTitle>Add fee head to structure</DialogTitle>
          <DialogDescription>Add a fee head to the {draft?.className} class structure.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {categories.filter((c) => !draft?.items.some((i) => i.feeCategoryId === c.id)).map((c) => (
            <AddItemRow key={c.id} category={c} onAdd={(amount) => addItemToDraft(c.id, amount)} />
          ))}
        </div>
      </Dialog>

      {/* Category editor dialog */}
      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogHeader>
          <DialogTitle>{editingCatId ? "Edit fee head" : "New fee head"}</DialogTitle>
          <DialogDescription>Configure a fee head. It becomes available for class structures and student add-ons.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Name *</label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Tuition Fee" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Code *</label>
              <Input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })} placeholder="TUITION" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Description</label>
            <Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Plan</label>
              <select
                value={catForm.recurringInterval}
                onChange={(e) => {
                  const interval = e.target.value as RecurringInterval;
                  setCatForm({ ...catForm, recurringInterval: interval, isRecurring: interval !== "ONCE" });
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly (per term)</option>
                <option value="YEARLY">Yearly</option>
                <option value="ONCE">One-time</option>
              </select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <input type="checkbox" className="accent-blue-600" checked={catForm.isOptional} onChange={(e) => setCatForm({ ...catForm, isOptional: e.target.checked })} />
                Optional
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <input type="checkbox" className="accent-blue-600" checked={catForm.isAddOn} onChange={(e) => setCatForm({ ...catForm, isAddOn: e.target.checked })} />
                Add-on
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <input type="checkbox" className="accent-emerald-600" checked={catForm.isActive} onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setNewCatOpen(false)} className="text-xs">Cancel</Button>
          <Button onClick={handleSaveCategory} className="bg-blue-600 hover:bg-blue-700 text-xs">Save fee head</Button>
        </div>
      </Dialog>
    </div>
  );
}

function AddItemRow({ category, onAdd }: { category: FeeCategory; onAdd: (amount: number) => void }) {
  const [qty, setQty] = useState("");
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs">
      <div>
        <p className="font-semibold">{category.name}</p>
        <p className="text-muted-foreground text-[10px]">
          {category.recurringInterval.toLowerCase()} · {category.isAddOn ? "add-on" : category.isOptional ? "optional" : "required"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="Amount" className="h-8 w-28 text-xs" onChange={(e) => setQty(e.target.value)} />
        <Button size="sm" className="h-8 text-xs" disabled={!Number(qty)} onClick={() => onAdd(Number(qty) || 0)}>
          Add
        </Button>
      </div>
    </div>
  );
}

function ReadOnlyStructureOverview({
  structures,
  classes,
  extra,
}: {
  structures: FeeStructure[];
  classes: { id: string; name: string; displayOrder: number }[];
  extra?: ReactNode;
}) {
  const { studentsInClass, categories } = useFees();
  const itemsMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {extra}
          Structure assignment overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead className="text-center">Fee Heads</TableHead>
              <TableHead className="text-right">Monthly Core</TableHead>
              <TableHead className="text-center">Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(new Set(classes.map((c) => c.name))).sort((a, b) => a.localeCompare(b)).map((cn) => {
              const st = structures.find((s) => s.className === cn);
              const monthly = (st?.items || [])
                .filter((i) => {
                  const cat = itemsMap.get(i.feeCategoryId);
                  return cat && cat.recurringInterval === "MONTHLY" && !cat.isAddOn;
                })
                .reduce((s, i) => s + i.amount, 0);
              return (
                <TableRow key={cn}>
                  <TableCell className="text-xs font-semibold">{cn}</TableCell>
                  <TableCell className="text-xs">{st ? st.name : <span className="text-amber-600">Not configured</span>}</TableCell>
                  <TableCell className="text-xs text-center">{st?.items.length || 0}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatCurrency(monthly)}</TableCell>
                  <TableCell className="text-xs text-center">{studentsInClass(cn, classes.find((c) => c.name === cn)?.id).length}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}