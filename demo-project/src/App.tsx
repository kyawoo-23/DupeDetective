import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import ButtonGroup from "./components/ButtonGroup";
import Cards from "./components/Cards";
import ContactForm from "./components/ContactForm";
import DataTable from "./components/DataTable";
import Modal from "./components/Modal";

// ── Duplicate families ────────────────────────────────────────────────────
import { Button } from "./components/Button";
import { ActionButton } from "./components/ActionButton";
import { SubmitButton } from "./components/SubmitButton";

import { Card } from "./components/Card";
import { InfoCard } from "./components/InfoCard";
import { SummaryCard } from "./components/SummaryCard";

import { Badge } from "./components/Badge";
import { StatusPill } from "./components/StatusPill";
import { Tag } from "./components/Tag";

import { Spinner } from "./components/Spinner";
import { LoadingIndicator } from "./components/LoadingIndicator";

import { TextInput } from "./components/TextInput";
import { FormField } from "./components/FormField";
import { InputField } from "./components/InputField";

import { ConfirmDialog } from "./components/ConfirmDialog";
import { AlertModal } from "./components/AlertModal";

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
        {title}
      </h2>
      <p className="text-slate-500 text-sm max-w-2xl">{desc}</p>
    </div>
  );
}

function ComponentBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{label}</p>
      {children}
    </div>
  );
}

export default function App() {
  // Primary modal (delete confirmation)
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  // ConfirmDialog ref
  const confirmRef = useRef<HTMLDialogElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // AlertModal ref
  const alertRef = useRef<HTMLDialogElement>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  // Demo input state
  const [textVal, setTextVal] = useState("");
  const [formVal, setFormVal] = useState("");
  const [inputVal, setInputVal] = useState("");

  const openModal = () => {
    setModalOpen(true);
    requestAnimationFrame(() => modalRef.current?.showModal());
  };

  const closeModal = () => {
    modalRef.current?.close();
    setModalOpen(false);
  };

  const openConfirm = () => {
    setConfirmOpen(true);
    requestAnimationFrame(() => confirmRef.current?.showModal());
  };

  const openAlert = () => {
    setAlertOpen(true);
    requestAnimationFrame(() => alertRef.current?.showModal());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onOpenModal={openModal} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-24">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-heading" className="pt-4">
          <p className="text-sm font-semibold tracking-wide text-indigo-500 uppercase mb-3">
            Component showcase
          </p>
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            UI patterns{" "}
            <span className="text-indigo-500">built to last</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mb-8">
            A demo codebase packed with realistic AI-generated component drift —
            buttons, cards, badges, inputs, loaders, and modals each appear in
            2–3 near-duplicate variants. Perfect for testing DupeDetective.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#section-buttons" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors">
              Explore components
            </a>
            <button type="button" onClick={openModal} className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:border-slate-400 hover:bg-white transition-colors">
              Open dialog
            </button>
          </div>
        </section>

        {/* ── Original components ───────────────────────────────────────── */}
        <ButtonGroup />
        <Cards />
        <ContactForm />
        <DataTable />

        {/* ══════════════════════════════════════════════════════════════
            DUPLICATE COMPONENT SHOWCASE
            Each group below has 2–3 components that do the same job
            with slight naming / prop / style drift.
        ═══════════════════════════════════════════════════════════════ */}

        {/* ── Button duplicates ─────────────────────────────────────────── */}
        <section id="section-dupe-buttons" aria-labelledby="dupe-btn-heading" className="scroll-mt-20">
          <SectionHeader
            title="Button variants (3 implementations)"
            desc="Button · ActionButton · SubmitButton — same job, different prop names, slightly different styles. A classic AI-generation pattern."
          />
          <div className="space-y-4">
            <ComponentBlock label="Button.tsx — uses variant='primary|secondary|danger'">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger" size="sm">Danger sm</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </ComponentBlock>

            <ComponentBlock label="ActionButton.tsx — uses type_='default|outline|destructive', size='small|normal|large'">
              <div className="flex flex-wrap gap-3">
                <ActionButton type_="default">Default</ActionButton>
                <ActionButton type_="outline">Outline</ActionButton>
                <ActionButton type_="destructive" size="small">Destructive sm</ActionButton>
                <ActionButton type_="default" loading>Loading…</ActionButton>
              </div>
            </ComponentBlock>

            <ComponentBlock label="SubmitButton.tsx — hardcoded primary, only pending state">
              <div className="flex flex-wrap gap-3">
                <SubmitButton label="Submit form" />
                <SubmitButton pending label="Submit form" pendingLabel="Saving…" />
                <SubmitButton label="Full width" fullWidth />
              </div>
            </ComponentBlock>
          </div>
        </section>

        {/* ── Card duplicates ───────────────────────────────────────────── */}
        <section id="section-dupe-cards" aria-labelledby="dupe-card-heading" className="scroll-mt-20">
          <SectionHeader
            title="Card variants (3 implementations)"
            desc="Card · InfoCard · SummaryCard — same layout concept with incremental feature creep, never consolidated."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              title="Card.tsx"
              description="The original: title + description + optional footer. Clean and minimal."
              footer={<span className="text-xs text-slate-400">sprint 1</span>}
            />
            <InfoCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              }
              heading="InfoCard.tsx"
              body="Sprint 4 addition: icon slot + action CTA. Same structure as Card, different props."
              action="Learn more"
            />
            <SummaryCard
              label="SummaryCard.tsx"
              value="Sprint 7"
              trend="third variant added"
              trendUp={false}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
              variant="tinted"
            />
          </div>
        </section>

        {/* ── Badge / pill / tag duplicates ─────────────────────────────── */}
        <section id="section-dupe-badges" aria-labelledby="dupe-badge-heading" className="scroll-mt-20">
          <SectionHeader
            title="Label / badge variants (3 implementations)"
            desc="Badge · StatusPill · Tag — all render a coloured chip label. Different prop names, different colour mappings, different spacing."
          />
          <div className="space-y-4">
            <ComponentBlock label="Badge.tsx — uses status='active|pending|inactive|error'">
              <div className="flex flex-wrap gap-2">
                <Badge status="active" />
                <Badge status="pending" />
                <Badge status="inactive" />
                <Badge status="error" />
              </div>
            </ComponentBlock>

            <ComponentBlock label="StatusPill.tsx — uses color='green|yellow|gray|red|blue', uppercase text">
              <div className="flex flex-wrap gap-2">
                <StatusPill color="green">Active</StatusPill>
                <StatusPill color="yellow">Pending</StatusPill>
                <StatusPill color="gray">Archived</StatusPill>
                <StatusPill color="red">Error</StatusPill>
                <StatusPill color="blue">Info</StatusPill>
              </div>
            </ComponentBlock>

            <ComponentBlock label="Tag.tsx — uses accent prop, adds optional onRemove handler">
              <div className="flex flex-wrap gap-2">
                <Tag label="Active" accent="teal" />
                <Tag label="Pending" accent="amber" />
                <Tag label="Error" accent="rose" />
                <Tag label="Removable" accent="indigo" onRemove={() => {}} />
              </div>
            </ComponentBlock>
          </div>
        </section>

        {/* ── Spinner / loader duplicates ───────────────────────────────── */}
        <section id="section-dupe-loaders" aria-labelledby="dupe-loader-heading" className="scroll-mt-20">
          <SectionHeader
            title="Loading indicator variants (2 implementations)"
            desc="Spinner · LoadingIndicator — SVG ring vs CSS border animation. Same purpose, written independently."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComponentBlock label="Spinner.tsx — SVG animated ring, size in px">
              <div className="flex items-center gap-6">
                <Spinner size={16} />
                <Spinner size={24} />
                <Spinner size={36} />
              </div>
            </ComponentBlock>
            <ComponentBlock label="LoadingIndicator.tsx — CSS border-t trick, scale='sm|md|lg'">
              <div className="flex items-center gap-8">
                <LoadingIndicator scale="sm" label="Small" />
                <LoadingIndicator scale="md" label="Medium" />
                <LoadingIndicator scale="lg" label="Large" />
              </div>
            </ComponentBlock>
          </div>
        </section>

        {/* ── Input / field duplicates ──────────────────────────────────── */}
        <section id="section-dupe-inputs" aria-labelledby="dupe-input-heading" className="scroll-mt-20">
          <SectionHeader
            title="Text input variants (3 implementations)"
            desc="TextInput · FormField · InputField — same labelled text input, three different prop shapes and slight visual differences."
          />
          <div className="space-y-4">
            <ComponentBlock label="TextInput.tsx — onChange(value: string), type prop">
              <TextInput
                id="demo-textinput"
                label="Full name"
                value={textVal}
                onChange={setTextVal}
                placeholder="Jane Smith"
                required
              />
            </ComponentBlock>

            <ComponentBlock label="FormField.tsx — onChange(event), hint prop, always type=text">
              <FormField
                id="demo-formfield"
                label="Username"
                value={formVal}
                onChange={(e) => setFormVal(e.target.value)}
                placeholder="jane_smith"
                hint="3–20 characters, letters and numbers only."
                required
              />
            </ComponentBlock>

            <ComponentBlock label="InputField.tsx — spreads HTMLInputAttributes, icon slot, inputSize prop">
              <InputField
                id="demo-inputfield"
                label="Search"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search projects…"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                }
              />
            </ComponentBlock>
          </div>
        </section>

        {/* ── Modal duplicates ──────────────────────────────────────────── */}
        <section id="section-dupe-modals" aria-labelledby="dupe-modal-heading" className="scroll-mt-20">
          <SectionHeader
            title="Modal / dialog variants (3 implementations)"
            desc="Modal · ConfirmDialog · AlertModal — three native <dialog> wrappers written in different sprints for the same use case."
          />
          <ComponentBlock label="Open each dialog variant">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={openModal}>Modal.tsx (delete flow)</Button>
              <Button variant="secondary" onClick={openConfirm}>ConfirmDialog.tsx</Button>
              <Button variant="secondary" onClick={openAlert}>AlertModal.tsx</Button>
            </div>
          </ComponentBlock>
        </section>

      </main>

      {/* Dialogs */}
      <Modal ref={modalRef} isOpen={modalOpen} onClose={closeModal} />

      <ConfirmDialog
        ref={confirmRef}
        title="Archive project?"
        message="This will move the project to your archive. You can restore it at any time."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={() => { confirmRef.current?.close(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />

      <AlertModal
        ref={alertRef}
        type="warning"
        heading="Unsaved changes"
        detail="You have unsaved changes that will be lost if you leave this page."
        onDismiss={() => { alertRef.current?.close(); setAlertOpen(false); }}
      />

      <footer className="border-t border-slate-200 mt-24 py-8 text-center text-sm text-slate-400">
        UI Components Demo — React 18 + Tailwind CSS v4 + Vite
      </footer>
    </div>
  );
}
