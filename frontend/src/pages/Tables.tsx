import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, QrCode, RefreshCw, Users, Download, Printer } from "lucide-react";
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
  fetchTables,
  updateTable,
} from "../services/api";

function createQrCode(id: number, name: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/menu?table=${id}&name=${encodeURIComponent(name)}`;
}

function getQrValue(table: ApiTable): string {
  return table.qrCode ?? table.qr_code ?? "No QR";
}

export default function Tables() {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewTable, setPreviewTable] = useState<ApiTable | null>(null);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTables = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTables();
        if (!isMounted) return;
        setTables(result.data ?? []);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load tables");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTables();

    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const total = tables.length;
    const active = tables.filter((t) => t.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [tables]);

  const toggleTableStatus = async (id: number) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;

    try {
      setUpdatingIds((prev) => new Set(prev).add(id));
      setError(null);
      const updated = await updateTable(id, {
        is_active: !(table.status === "active"),
      });
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setPreviewTable((prev) => (prev && prev.id === id ? updated : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update table status");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const regenerateQR = async (id: number) => {
    const table = tables.find((t) => t.id === id);
    if (!table) return;
    
    try {
      setUpdatingIds((prev) => new Set(prev).add(id));
      setError(null);
      const updated = await updateTable(id, { qr_code: createQrCode(id, table.name) });
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setPreviewTable((prev) => (prev && prev.id === id ? updated : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate QR");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  const handleDownloadPreview = () => {
    if (!previewTable || !qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${previewTable.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintPreview = () => {
    if (!previewTable) return;

    const qrValue = getQrValue(previewTable);
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) {
      setError("Popup was blocked. Please allow popups to print.");
      return;
    }

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
          <div class="qr-container">
            <div id="qr"></div>
          </div>
          <p class="info">Scan to view menu and place order</p>
          <p class="link">${qrValue}</p>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.getElementById('qr'), '${qrValue}', {
              width: 300,
              margin: 2
            });
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4B2E2B]">Tables</h1>
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
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={
              table.status === "active"
                ? "border-emerald-200 bg-white"
                : "border-neutral-200 bg-white"
            }
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
                <StatusBadge status={table.status} />
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
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
            <Button className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white" onClick={handleCreateTable} disabled={isCreating}>
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <QRCodeSVG 
                    value={getQrValue(previewTable)} 
                    size={256} 
                    level="H"
                    includeMargin={true}
                  />
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
                <Button
                  variant="outline"
                  className="border-[#EAD6C0] text-[#4B2E2B]"
                  onClick={handleDownloadPreview}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="bg-[#4B2E2B] hover:bg-[#5B3E3B] text-white"
                  onClick={handlePrintPreview}
                >
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
