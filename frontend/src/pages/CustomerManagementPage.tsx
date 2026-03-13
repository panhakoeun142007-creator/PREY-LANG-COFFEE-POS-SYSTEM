import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  createStaff,
  deleteStaff,
  fetchStaffs,
  StaffApiItem,
  updateStaff,
} from "../services/api";
import { useSettings } from "../context/SettingsContext";

type StatusFilter = "all" | "active" | "inactive";

type StaffFormState = {
  name: string;
  email: string;
  password: string;
  salary: string;
  is_active: boolean;
  profile_image: File | null;
};

const initialForm: StaffFormState = {
  name: "",
  email: "",
  password: "",
  salary: "0",
  is_active: true,
  profile_image: null,
};

export default function StaffManagementPage() {
  const { currency } = useSettings();
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }),
    [currency],
  );
  const [staffs, setStaffs] = useState<StaffApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffApiItem | null>(null);
  const [form, setForm] = useState<StaffFormState>(initialForm);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [staffPasswordVisibility, setStaffPasswordVisibility] = useState<Record<number, boolean>>({});

  const loadStaffs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchStaffs({
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      });
      setStaffs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
      setStaffs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadStaffs();
  }, [loadStaffs]);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
    };
  }, [profilePreviewUrl]);

  const filteredStaffs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staffs;
    return staffs.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term),
    );
  }, [staffs, search]);

  const totalSalary = filteredStaffs.reduce((sum, c) => sum + Number(c.salary || 0), 0);

  function openAddDialog() {
    if (profilePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreviewUrl);
    }
    setEditingStaff(null);
    setForm(initialForm);
    setProfilePreviewUrl(null);
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openEditDialog(staff: StaffApiItem) {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      email: staff.email,
      password: staff.password_plain ?? "",
      salary: String(staff.salary),
      is_active: staff.is_active,
      profile_image: null,
    });
    if (profilePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreviewUrl);
    }
    setProfilePreviewUrl(staff.profile_image_url ?? null);
    setShowPassword(false);
    setDialogOpen(true);
  }

  function handleProfileImageChange(file: File | null) {
    if (profilePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreviewUrl);
    }

    if (!file) {
      setForm((prev) => ({ ...prev, profile_image: null }));
      setProfilePreviewUrl(editingStaff?.profile_image_url ?? null);
      return;
    }

    setForm((prev) => ({ ...prev, profile_image: file }));
    setProfilePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    const name = form.name.trim();
    const email = form.email.trim();
    const salary = Number(form.salary);
    const password = form.password.trim();

    if (!name || !email || !Number.isFinite(salary) || salary < 0) {
      return;
    }

    if (!editingStaff && password.length < 6) {
      setError("Password must be at least 6 characters for new staff.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingStaff) {
        await updateStaff(editingStaff.id, {
          name,
          email,
          salary,
          is_active: form.is_active,
          password: password ? password : undefined,
          profile_image: form.profile_image,
        });
      } else {
        await createStaff({
          name,
          email,
          salary,
          is_active: form.is_active,
          password,
          profile_image: form.profile_image,
        });
      }

      await loadStaffs();
      setDialogOpen(false);
      if (profilePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
      setProfilePreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(staff: StaffApiItem) {
    const confirmed = window.confirm(`Delete staff "${staff.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteStaff(staff.id);
      await loadStaffs();
      setStaffPasswordVisibility((prev) => {
        const next = { ...prev };
        delete next[staff.id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C5D58]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#7C5D58]">
            <p>
              Total Staff:{" "}
              <span className="font-semibold text-[#4B2E2B]">{filteredStaffs.length}</span>
            </p>
            <p>
              Total Salary:{" "}
              <span className="font-semibold text-[#4B2E2B]">{money.format(totalSalary)}</span>
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#7C5D58]">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : filteredStaffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#7C5D58]">
                    No staff found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaffs.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {staff.profile_image_url ? (
                          <img
                            src={staff.profile_image_url}
                            alt={staff.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5E6D3] text-xs font-semibold text-[#4B2E2B]">
                            {staff.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() ?? "")
                              .join("") || "ST"}
                          </div>
                        )}
                        <span>{staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      {staff.password_plain ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {staffPasswordVisibility[staff.id] ? staff.password_plain : "********"}
                          </span>
                          <button
                            type="button"
                            className="text-[#7C5D58] hover:text-[#4B2E2B]"
                            aria-label={staffPasswordVisibility[staff.id] ? "Hide staff password" : "Show staff password"}
                            onClick={() =>
                              setStaffPasswordVisibility((prev) => ({
                                ...prev,
                                [staff.id]: !prev[staff.id],
                              }))
                            }
                          >
                            {staffPasswordVisibility[staff.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7C5D58]">Set in Edit</span>
                      )}
                    </TableCell>
                    <TableCell>{money.format(Number(staff.salary || 0))}</TableCell>
                    <TableCell>
                      <span
                        className={
                          staff.is_active
                            ? "font-semibold text-green-600"
                            : "font-semibold text-[#7C5D58]"
                        }
                      >
                        {staff.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(staff)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(staff)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update staff profile image, email, password, salary and account status."
                : "Create a staff account with profile image, email, password and salary."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Profile Image</label>
              <div className="flex items-center gap-3">
                {profilePreviewUrl ? (
                  <img
                    src={profilePreviewUrl}
                    alt="Profile preview"
                    className="h-14 w-14 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-[#F5E6D3] text-sm font-semibold text-[#4B2E2B]">
                    {form.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("") || "ST"}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleProfileImageChange(event.target.files?.[0] ?? null)}
                />
              </div>
              <p className="text-xs text-[#7C5D58]">Optional. JPG/PNG/WEBP up to 5MB.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Staff name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="staff@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Password {editingStaff ? "(edit anytime)" : ""}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Minimum 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 inline-flex items-center text-[#7C5D58] hover:text-[#4B2E2B]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Salary</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.salary}
                onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <p className="text-sm font-medium">Active Account</p>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: Boolean(checked) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                if (profilePreviewUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(profilePreviewUrl);
                }
                setProfilePreviewUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingStaff ? "Save Changes" : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
