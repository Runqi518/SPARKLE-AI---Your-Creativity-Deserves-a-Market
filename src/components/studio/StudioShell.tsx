"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { newProject, request } from "./data";
import "./studio.css";

export function CreateDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"basic" | "free" | null>(null);
  const [name, setName] = useState("");
  const [basicType, setBasicType] = useState("t2v");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    if (!mode || busy) return;
    setBusy(true);
    setError("");
    try {
      const id = await newProject(
        mode,
        name.trim() || "Untitled project",
        undefined,
        basicType,
      );
      router.push(`/project/${id}`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={mode ? "Your next project" : "Where would you like to start?"}
      onClose={onClose}
      wide={!mode}
    >
      {!mode ? (
        <>
          <p className="dialog-intro">
            Choose a starting point. Keep creating on the same canvas.
          </p>
          <div className="creation-options">
            <button
              onClick={() => {
                router.push("/commercial/market?choose=template");
                onClose();
              }}
            >
              <span className="mode-art template-art">
                <i />
                <i />
                <i />
              </span>
              <small>01</small>
              <h3>Template creation</h3>
              <p>Use a creative workflow or start with a reference ad.</p>
              <span className="text-link">
                Explore templates <ArrowUpRight size={15} />
              </span>
            </button>
            <button onClick={() => setMode("basic")}>
              <span className="mode-art basic-art">
                <i />
                <b>Play</b>
              </span>
              <small>02</small>
              <h3>Basic creation</h3>
              <p>Text to video, image to video, or edit existing footage.</p>
              <span className="text-link">
                Choose a format <ArrowUpRight size={15} />
              </span>
            </button>
            <button onClick={() => setMode("free")}>
              <span className="mode-art free-art">
                <i />
                <i />
                <i />
              </span>
              <small>03</small>
              <h3>Free creation</h3>
              <p>An open canvas for your ideas, assets and experiments.</p>
              <span className="text-link">
                Start from scratch <ArrowUpRight size={15} />
              </span>
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
          className="studio-form"
        >
          <label>
            Project name
            <input
              autoFocus
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled project"
            />
          </label>
          {mode === "basic" && (
            <label>
              Starting point
              <select
                value={basicType}
                onChange={(e) => setBasicType(e.target.value)}
              >
                <option value="t2v">Text to video</option>
                <option value="i2v">Image to video</option>
                <option value="edit">Edit a video</option>
              </select>
            </label>
          )}
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setMode(null)}
            >
              Back
            </button>
            <button disabled={busy} className="primary-button">
              {busy ? "Creating..." : "Open canvas"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function StudioShell({
  children,
  projectName,
  pageTitle,
  description,
  onRenameProject,
  actions,
}: {
  children: ReactNode;
  projectName?: string;
  pageTitle?: string;
  description?: string;
  onRenameProject?: (name: string) => Promise<void>;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [create, setCreate] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const isCanvas = pathname.startsWith("/project/");
  async function saveName() {
    if (!onRenameProject || savingName) return;
    const nextName = nameDraft.trim();
    if (!nextName) {
      setNameError("Enter a canvas name.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      await onRenameProject(nextName);
      setEditingName(false);
    } catch (error) {
      setNameError((error as Error).message);
    } finally {
      setSavingName(false);
    }
  }
  return (
    <div
      className={`sparkle-app ${collapsed ? "nav-collapsed" : ""} ${isCanvas ? "canvas-app" : ""}`}
    >
      <aside className={`studio-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand-row">
          <Link href="/" className="wordmark">
            SPARKLE
          </Link>
          <button
            className="icon-button"
            aria-label="Collapse navigation"
            onClick={() => {
              setCollapsed(true);
              setMobileNav(false);
            }}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
        <button
          className="create-button"
          onClick={() => {
            setCreate(true);
            setMobileNav(false);
          }}
        >
          <span>Start Creating</span><Plus size={16} aria-hidden="true" />
        </button>
        <div className="nav-group">
          <span className="eyebrow nav-section-title">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 2a7 7 0 0 0-4.7 12.2c1 .9 1.7 1.9 1.7 3.3h6c0-1.4.7-2.4 1.7-3.3A7 7 0 0 0 12 2Z" /><path fill="currentColor" stroke="none" d="M9 19h6v2H9zm1 3h4v1h-4z" /></svg>
            WORKSPACE
          </span>
          <Link className={pathname === "/" ? "active" : ""} href="/">
            Projects
          </Link>
          <Link className={isCanvas ? "active" : ""} href="/project/demo">
            Canvas
          </Link>
          <Link
            className={pathname === "/assets" ? "active" : ""}
            href="/assets"
          >
            Assets
          </Link>
        </div>
        <div className="nav-group">
          <span className="eyebrow nav-section-title">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M15 8.5h-4.5a2 2 0 0 0 0 4H13.5a2 2 0 0 1 0 4H9M12 6.5v12" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
            MARKETSPACE
          </span>
          {[
            ["/commercial/market", "Templates"],
            ["/commercial/subjects", "Bounties"],
            ["/commercial/orders", "Orders"],
          ].map(([href, title]) => (
            <Link
              className={pathname.startsWith(href) ? "active" : ""}
              key={href}
              href={href}
            >
              {title}
            </Link>
          ))}
        </div>
        <div className="sidebar-bottom">
          <Link href="/commercial/orders" className="profile-row">
            <span className="avatar">Y</span>
            <span>
              My studio<small>Local preview</small>
            </span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-header">
          <button
            className="icon-button expand-nav"
            aria-label="Open navigation"
            onClick={() => {
              setCollapsed(false);
              setMobileNav(!mobileNav);
            }}
          >
            <PanelLeftOpen size={18} />
          </button>
          <div className="header-copy">
          <div className="breadcrumbs">
            {editingName ? (
              <form className="canvas-name-form" onSubmit={event => { event.preventDefault(); void saveName(); }}>
                <input autoFocus aria-label="Canvas name" value={nameDraft} maxLength={50} disabled={savingName}
                  onChange={event => { setNameDraft(event.target.value); setNameError(""); }}
                  onKeyDown={event => { if (event.key === "Escape" && !savingName) { event.preventDefault(); setEditingName(false); setNameError(""); } }} />
                <button type="submit" className="icon-button" aria-label="Save canvas name" disabled={savingName}><Check size={17} /></button>
                <button type="button" className="icon-button" aria-label="Cancel rename" disabled={savingName} onClick={() => { setEditingName(false); setNameError(""); }}><X size={16} /></button>
                {nameError && <span className="canvas-name-error" role="alert">{nameError}</span>}
              </form>
            ) : projectName && onRenameProject ? (
              <button className="canvas-name-button" aria-label={`Rename canvas: ${projectName}`} title="Rename canvas"
                onClick={() => { setNameDraft(projectName); setNameError(""); setEditingName(true); }}>
                <strong>{projectName}</strong><Pencil size={14} />
              </button>
            ) : (
              <h1 className="header-title">{projectName || pageTitle || (pathname === "/" ? "My projects" : pathname === "/assets" ? "My assets" : pathname.startsWith("/commercial/subjects") ? "Bounties" : pathname.startsWith("/commercial/orders") ? "Orders" : "Templates")}</h1>
            )}
          </div>
          {description && <p className="header-description">{description}</p>}
          </div>
          <div className="header-actions">
            {actions || (
              <>
                <span className="avatar small">Y</span>
              </>
            )}
          </div>
        </header>
        {children}
      </div>
      {mobileNav && (
        <button
          className="mobile-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        >
          <X />
        </button>
      )}
      {create && <CreateDialog onClose={() => setCreate(false)} />}
    </div>
  );
}

export function ProjectsHome() {
  const [creating, setCreating] = useState(false);
  const [projects, setProjects] = useState<
    { id: string; name: string; mode: string; nodesCount: number }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request<{ projects: typeof projects }>("/api/projects")
      .then((data) => {
        if (active) setProjects(data.projects);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  async function deleteSelected() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/projects/${deleting.id}`, { method: "DELETE" });
      setProjects(projects.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <StudioShell actions={<button className="primary-button compact" onClick={() => setCreating(true)}>New project <Plus size={16} /></button>}>
      <main className="workspace-home page-scroll">
        <section className="project-section">
          {error && <p role="alert">{error}</p>}
          <div className="project-grid">
            <button
              className="new-project-tile"
              onClick={() => setCreating(true)}
            >
              <Plus size={24} />
              <strong>Start something new</strong>
              <span>Template, basic or free creation</span>
            </button>
            {projects.map((p) => (
              <article className="project-tile" key={p.id}>
                <Link href={`/project/${p.id}`}>
                  <div className="project-thumbnail">
                    <span className="mini-node" />
                    <span className="mini-node" />
                    <span className="mini-node" />
                  </div>
                  <div className="project-tile-info">
                    <strong>{p.name}</strong>
                    <span>
                      {p.mode} creation · {p.nodesCount} elements
                    </span>
                  </div>
                </Link>
                <button
                  className="icon-button project-delete"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>
        {deleting && (
          <Dialog
            title="Delete this project?"
            onClose={() => setDeleting(null)}
          >
            <p className="dialog-intro">
              {deleting.name} and its canvas will be permanently deleted.
              Uploaded source assets remain in your library.
            </p>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="secondary-button"
                onClick={() => setDeleting(null)}
              >
                Keep project
              </button>
              <button
                disabled={busy}
                className="primary-button"
                onClick={() => void deleteSelected()}
              >
                {busy ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </Dialog>
        )}
        {creating && <CreateDialog onClose={() => setCreating(false)} />}
      </main>
    </StudioShell>
  );
}
