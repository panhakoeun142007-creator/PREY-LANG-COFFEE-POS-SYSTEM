import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Trash2, Users, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { StatusBadge } from "../components/StatusBadge";
import {
  ApiTable,
  createTable,
  deleteTable,
  fetchTables,
  updateTable,
} from "../services/api";
import { useAutoRefresh } from "../hooks";

function resolveCustomerBaseUrl(): string {
  const configured = ((import.meta.env.VITE_CUSTOMER_APP_URL as string | undefined) || "").trim();
  const origin = new URL(window.location.origin);

  const normalizeToUrl = (value: string): URL | null => {
    const candidate = value.replace(/\/+$/, "");
    try {
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) return new URL(candidate);
      if (candidate.startsWith("localhost") || candidate.startsWith("127.0.0.1")) return new URL(`http://${candidate}`);
      return new URL(`https://${candidate}`);
    } catch {
      return null;
    }
  };

  const configuredUrl = configured ? normalizeToUrl(configured) : null;
  if (!configuredUrl) return origin.toString().replace(/\/+$/, "");

  // If configured is just an apex/www variant of the current frontend host, prefer the current host.
  // This avoids QR links pointing at a domain that may not have a valid SSL certificate yet.
  const originHost = origin.hostname.toLowerCase();
  const configuredHost = configuredUrl.hostname.toLowerCase();
  const isLocalOrigin =
    originHost === "localhost" ||
    originHost === "127.0.0.1" ||
    originHost.endsWith(".localhost");

  if (!isLocalOrigin) {
    const originWithoutWww = originHost.startsWith("www.") ? originHost.slice(4) : originHost;
    const configuredWithoutWww = configuredHost.startsWith("www.") ? configuredHost.slice(4) : configuredHost;

    if (originWithoutWww === configuredWithoutWww) {
      return origin.toString().replace(/\/+$/, "");
    }
  }

  return configuredUrl.toString().replace(/\/+$/, "");
}

function createQrCode(id: number, name: string): string {
  const baseUrl = resolveCustomerBaseUrl();
  return `${baseUrl}/menu?table=${id}&name=${encodeURIComponent(name)}`;
}

function getQrValue(table: ApiTable): string {
  const baseUrl = resolveCustomerBaseUrl();
  const configured = ((import.meta.env.VITE_CUSTOMER_APP_URL as string | undefined) || "").trim();

  const raw =
    table.qrUrl ??
    table.qr_url ??
    table.qrCode ??
    table.qr_code ??
    "";

  // If backend already provides a full URL, use it.
  if (typeof raw === "string" && raw.trim()) {
    const value = raw.trim();
    if (/^https?:\/\//i.test(value)) {
      if (configured && typeof table.id === "number" && table.name) {
        try {
          const stored = new URL(value);
          const expected = new URL(baseUrl);
          if (stored.host.toLowerCase() !== expected.host.toLowerCase()) {
            return createQrCode(table.id, table.name);
          }
        } catch {
          // ignore and keep stored value
        }
      }
      return value;
    }
    if (value.startsWith("/")) return `${baseUrl}${value}`;
  }

  // Fallback: always generate a real customer menu URL from table id + name.
  // This prevents QR codes like "QR-TABLE-A1" from being unscannable on phones.
  if (typeof table.id === "number" && table.name) {
    return createQrCode(table.id, table.name);
  }

  return "No QR";
}

export default function Tables() {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<ApiTable | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("4");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ApiTable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Preview dialog
  const [previewTable, setPreviewTable] = useState<ApiTable | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const loadTables = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      try {
        if (background) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
          setError(null);
        }

        const result = await fetchTables();
        setTables(result.data ?? []);
      } catch (err) {
        if (!background) {
          setError(err instanceof Error ? err.message : "Failed to load tables");
        }
      } finally {
        if (background) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  useAutoRefresh(() => loadTables({ background: true }), { intervalMs: 15000, immediate: false });

  const counts = useMemo(() => {
    const total = tables.length;
    const active = tables.filter((t) => t.is_active).length;
    return { total, active, inactive: total - active };
  }, [tables]);

  function markUpdating(id: number) {
    setUpdatingIds((prev) => new Set(prev).add(id));
  }
  function unmarkUpdating(id: number) {
    setUpdatingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  const toggleTableStatus = async (id: number) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;
    try {
      markUpdating(id);
      setError(null);
      const updated = await updateTable(id, { is_active: !(table.status === "active") });
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setPreviewTable((prev) => (prev?.id === id ? updated : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update table status");
    } finally {
      unmarkUpdating(id);
    }
  };

  const regenerateQR = async (id: number) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;
    try {
      markUpdating(id);
      setError(null);
      const updated = await updateTable(id, { qr_code: createQrCode(id, table.name) });
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setPreviewTable((prev) => (prev?.id === id ? updated : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate QR");
    } finally {
      unmarkUpdating(id);
    }
  };

  const handleCreateTable = async () => {
    const name = newTableName.trim();
    const capacity = Number(newTableCapacity);
    if (!name || !Number.isFinite(capacity) || capacity < 1) return;
    try {
      setIsCreating(true);
      setError(null);
      const created = await createTable({ name, capacity, is_active: true });
      setTables((prev) => [created, ...prev]);
      setNewTableName("");
      setNewTableCapacity("4");
      setIsAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create table");
    } finally {
      setIsCreating(false);
    }
  };

  function openEditDialog(table: ApiTable) {
    setEditTarget(table);
    setEditName(table.name);
    setEditCapacity(String(table.capacity));
  }

  const handleEditTable = async () => {
    if (!editTarget) return;
    const name = editName.trim();
    const capacity = Number(editCapacity);
    if (!name || !Number.isFinite(capacity) || capacity < 1) return;
    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateTable(editTarget.id, { name, capacity });
      setTables((prev) => prev.map((t) => (t.id === editTarget.id ? updated : t)));
      setPreviewTable((prev) => (prev?.id === editTarget.id ? updated : prev));
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update table");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setError(null);
      await deleteTable(deleteTarget.id);
      setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (previewTable?.id === deleteTarget.id) setPreviewTable(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete table");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPreview = () => {
    if (!previewTable || !qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 512;
    canvas.height = 512;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${previewTable.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrintPreview = () => {
    if (!previewTable) return;
    const qrValue = getQrValue(previewTable);
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) { setError("Popup was blocked. Please allow popups to print."); return; }
    win.document.write(`
      <html>
        <head>
          <title>${previewTable.name} QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            h1 { margin-bottom: 10px; color: #4B2E2B; }
            .qr-container { margin: 30px auto; }
            .info { color: #666; margin-top: 20px; font-size: 14px; }
            .link { color: #4B2E2B; word-break: break-all; font-size: 12px; margin-top: 15px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>${previewTable.name}</h1>
          <p class="info">Capacity: ${previewTable.capacity} people</p>
          <div class="qr-container"><div id="qr"></div></div>
          <p class="info">Scan to view menu and place order</p>
          <p class="link">${qrValue}</p>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.getElementById('qr'), '${qrValue}', { width: 300, margin: 2 });
            setTimeout(() => window.print(), 500);
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[#4B2E2B]">Tables</h1>
            {isRefreshing && !isLoading && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-xs text-[#7C5D58] border border-[#EAD6C0]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Refreshing
              </span>
            )}
          </div>
          <p className="mt-1 text-[#7C5D58]">
            Total Tables: <span className="font-semibold">{counts.total}</span>
          </p>
          <p className="text-sm text-[#7C5D58]">
            Active: <span className="font-semibold text-emerald-700">{counts.active}</span> | Inactive:{" "}
            <span className="font-semibold text-neutral-600">{counts.inactive}</span>
          </p>
        </div>
        <Button className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-[#EAD6C0] bg-white p-4 text-sm text-[#7C5D58]">
          Loading tables...
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-lg border border-[#EAD6C0] bg-white p-8 text-center text-sm text-[#7C5D58]">
          No tables yet. Click "Add Table" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={table.status === "active" ? "border-emerald-200 bg-white" : "border-neutral-200 bg-white"}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base text-[#4B2E2B]">{table.name}</CardTitle>
                    <div className="mt-2 inline-flex items-center gap-1 text-sm text-[#7C5D58]">
                      <Users className="h-4 w-4" />
                      Capacity: {table.capacity}
                    </div>
                  </div>
                  <StatusBadge status={table.status === "active" ? "active" : "inactive"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-[#EAD6C0] bg-[#F5E6D3] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <QRCodeSVG value={getQrValue(table)} size={48} level="M" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#7C5D58] mb-1">Scan to order</p>
                      <a
                        href={getQrValue(table)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#4B2E2B] hover:text-[#6B4E4B] underline truncate block"
                      >
                        {getQrValue(table)}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#7C5D58]">
                    {table.status === "active" ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={table.status === "active"}
                    onCheckedChange={() => toggleTableStatus(table.id)}
                    disabled={updatingIds.has(table.id)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-[#EAD6C0] text-[#4B2E2B]"
                    onClick={() => setPreviewTable(table)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#EAD6C0] text-[#4B2E2B]"
                    onClick={() => regenerateQR(table.id)}
                    disabled={updatingIds.has(table.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regen QR
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#EAD6C0] text-[#4B2E2B]"
                    onClick={() => openEditDialog(table)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(table)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setNewTableName(""); setNewTableCapacity("4"); } }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>Create a new table for dine-in ordering.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tableName">Table Name</Label>
              <Input
                id="tableName"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="e.g. Table 9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableCapacity">Capacity</Label>
              <Input
                id="tableCapacity"
                type="number"
                min={1}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#EAD6C0] text-[#4B2E2B]" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white"
              onClick={handleCreateTable}
              disabled={isCreating || !newTableName.trim() || Number(newTableCapacity) < 1}
            >
              {isCreating ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update the table name or capacity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editTableName">Table Name</Label>
              <Input
                id="editTableName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Table 9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTableCapacity">Capacity</Label>
              <Input
                id="editTableCapacity"
                type="number"
                min={1}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#EAD6C0] text-[#4B2E2B]" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white"
              onClick={handleEditTable}
              disabled={isSaving || !editName.trim() || Number(editCapacity) < 1}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Delete "${deleteTarget.name}"? This cannot be undone.`
                : "Delete this table? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-[#EAD6C0] text-[#4B2E2B]" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTable} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Preview Dialog */}
      <Dialog open={Boolean(previewTable)} onOpenChange={(open) => !open && setPreviewTable(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{previewTable?.name} QR Preview</DialogTitle>
            <DialogDescription>Use this QR code for customer table ordering.</DialogDescription>
          </DialogHeader>
          {previewTable && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#EAD6C0] bg-[#F5E6D3] p-6 text-center">
                <div ref={qrRef} className="inline-block">
                  <QRCodeSVG value={getQrValue(previewTable)} size={256} level="H" includeMargin={true} />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#4B2E2B]">{previewTable.name}</p>
                <p className="mt-1 text-xs text-[#7C5D58]">Capacity: {previewTable.capacity} people</p>
                <p className="mt-2 text-xs text-[#7C5D58] mb-2">Scan QR code or visit link below:</p>
                <a
                  href={getQrValue(previewTable)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#4B2E2B] hover:text-[#6B4E4B] underline break-all"
                >
                  {getQrValue(previewTable)}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-[#EAD6C0] text-[#4B2E2B]" onClick={handleDownloadPreview}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white" onClick={handlePrintPreview}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
