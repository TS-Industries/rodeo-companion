import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Phone, Mail, Plus, Pencil, Trash2, X, Check,
  Loader2, ChevronDown,
} from "lucide-react";
// Partner role definitions (mirrored from schema)
const PARTNER_ROLE_LABELS: Record<string, string> = {
  header: "Header",
  heeler: "Heeler",
  partner: "Partner",
  coach: "Coach",
  other: "Other",
};
type PartnerRole = "header" | "heeler" | "partner" | "coach" | "other";

const PARTNER_ROLES = ["header", "heeler", "partner", "coach", "other"] as const;

const ROLE_COLORS: Record<PartnerRole, { bg: string; text: string; border: string }> = {
  header:  { bg: "oklch(0.65 0.18 25 / 15%)",  text: "oklch(0.75 0.20 30)",  border: "oklch(0.65 0.18 25 / 40%)" },
  heeler:  { bg: "oklch(0.65 0.14 195 / 15%)", text: "oklch(0.72 0.16 200)", border: "oklch(0.65 0.14 195 / 40%)" },
  partner: { bg: "oklch(0.72 0.16 75 / 15%)",  text: "oklch(0.78 0.18 80)",  border: "oklch(0.72 0.16 75 / 40%)" },
  coach:   { bg: "oklch(0.65 0.14 145 / 15%)", text: "oklch(0.72 0.16 145)", border: "oklch(0.65 0.14 145 / 40%)" },
  other:   { bg: "oklch(0.50 0.05 60 / 15%)",  text: "oklch(0.62 0.05 65)",  border: "oklch(0.50 0.05 60 / 40%)" },
};

const ROLE_EMOJI: Record<PartnerRole, string> = {
  header: "🎯", heeler: "🪢", partner: "🤝", coach: "📋", other: "👤",
};

interface ContactFormData {
  name: string;
  role: PartnerRole;
  phone: string;
  email: string;
  notes: string;
}

const emptyForm: ContactFormData = { name: "", role: "partner", phone: "", email: "", notes: "" };

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: any;
  onEdit: (c: any) => void;
  onDelete: (id: number) => void;
}) {
  const rc = ROLE_COLORS[contact.role as PartnerRole] ?? ROLE_COLORS.other;
  const emoji = ROLE_EMOJI[contact.role as PartnerRole] ?? "👤";
  const label = PARTNER_ROLE_LABELS[contact.role as PartnerRole] ?? contact.role;

  return (
    <div
      className="card-western rounded-2xl p-4 transition-all"
      style={{ border: `1px solid ${rc.border}` }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: rc.bg, border: `1px solid ${rc.border}` }}
        >
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base leading-tight" style={{ color: "oklch(0.93 0.03 75)" }}>
              {contact.name}
            </h3>
            <span
              className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
            >
              {label}
            </span>
          </div>

          <div className="mt-1.5 space-y-1">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.65 0.14 195)" }}
              >
                <Phone className="w-3 h-3 flex-shrink-0" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.65 0.14 145)" }}
              >
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.notes && (
              <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.05 60)" }}>
                {contact.notes}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(contact)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "oklch(0.72 0.16 75 / 12%)", border: "1px solid oklch(0.72 0.16 75 / 25%)" }}
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.16 75)" }} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove ${contact.name} from contacts?`)) onDelete(contact.id);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "oklch(0.65 0.18 25 / 12%)", border: "1px solid oklch(0.65 0.18 25 / 25%)" }}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: ContactFormData;
  onSave: (data: ContactFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ContactFormData>(initial);
  const set = (k: keyof ContactFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="card-western rounded-2xl p-4 space-y-3"
      style={{ border: "1px solid oklch(0.72 0.16 75 / 40%)", boxShadow: "0 0 20px oklch(0.72 0.16 75 / 15%)" }}
    >
      <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "oklch(0.78 0.18 80)" }}>
        {initial.name ? "Edit Contact" : "New Contact"}
      </h3>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Role</Label>
          <div className="relative mt-1">
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value as PartnerRole)}
              className="w-full rounded-lg px-3 py-2 text-sm appearance-none pr-8"
              style={{
                background: "oklch(0.20 0.04 48)",
                border: "1px solid oklch(0.30 0.06 50)",
                color: "oklch(0.88 0.03 75)",
              }}
            >
              {PARTNER_ROLES.map((r) => (
                <option key={r} value={r}>{PARTNER_ROLE_LABELS[r]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "oklch(0.52 0.05 60)" }} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Phone</Label>
          <Input
            type="tel"
            placeholder="e.g. +1 403 555 0100"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            placeholder="partner@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Input
            placeholder="Any notes…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="btn-gold flex-1"
          disabled={isSaving || !form.name.trim()}
          onClick={() => onSave(form)}
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initial.name ? "Save Changes" : "Add Contact"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Contacts() {
  useAuth();
  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => { toast.success("Contact added!"); utils.contacts.list.invalidate(); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact updated!"); utils.contacts.list.invalidate(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact removed"); utils.contacts.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const handleCreate = (data: ContactFormData) => {
    createContact.mutate({
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    });
  };

  const handleUpdate = (data: ContactFormData) => {
    if (!editing) return;
    updateContact.mutate({
      id: editing.id,
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    });
  };

  // Group by role
  const grouped: Record<string, any[]> = {};
  for (const c of contacts ?? []) {
    if (!grouped[c.role]) grouped[c.role] = [];
    grouped[c.role].push(c);
  }

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Hero */}
      <div className="hero-western relative px-4 pt-10 pb-6">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">🤝</div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1"
            style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Team Roping & Partners ✦</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            Contacts
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>
            Headers, heelers, coaches &amp; partners
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4">
        {/* Add button */}
        {!showForm && !editing && (
          <Button
            className="btn-gold w-full gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        )}

        {/* Create form */}
        {showForm && (
          <ContactForm
            initial={emptyForm}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            isSaving={createContact.isPending}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (contacts ?? []).length === 0 && !showForm && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "oklch(0.18 0.04 46)", border: "1px dashed oklch(0.30 0.06 50)" }}>
            <div className="text-5xl mb-3">🤝</div>
            <p className="font-black text-lg mb-1"
              style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
              No contacts yet
            </p>
            <p className="text-xs mb-4" style={{ color: "oklch(0.52 0.05 60)" }}>
              Add your header, heeler, or coach to link them to rodeo entries
            </p>
          </div>
        )}

        {/* Contacts grouped by role */}
        {Object.entries(grouped).map(([role, items]) => (
          <div key={role} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-base">{ROLE_EMOJI[role as PartnerRole] ?? "👤"}</span>
              <span className="text-xs font-black uppercase tracking-wide"
                style={{ color: ROLE_COLORS[role as PartnerRole]?.text ?? "oklch(0.62 0.05 65)" }}>
                {PARTNER_ROLE_LABELS[role as PartnerRole] ?? role}s
              </span>
              <div className="flex-1 h-px" style={{ background: "oklch(0.28 0.06 50)" }} />
              <span className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>{items.length}</span>
            </div>
            {items.map((c) =>
              editing?.id === c.id ? (
                <ContactForm
                  key={c.id}
                  initial={{ name: c.name, role: c.role, phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" }}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                  isSaving={updateContact.isPending}
                />
              ) : (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onEdit={setEditing}
                  onDelete={(id) => deleteContact.mutate({ id })}
                />
              )
            )}
          </div>
        ))}

        {/* Info card */}
        <div className="rounded-xl p-3 flex gap-2"
          style={{ background: "oklch(0.18 0.04 46)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <Users className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.62 0.05 65)" }} />
          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
            Link a contact to a rodeo entry from the Schedule detail page. Linked partners will appear on the rodeo card so you can quickly call or text them.
          </p>
        </div>
      </div>
    </div>
  );
}
