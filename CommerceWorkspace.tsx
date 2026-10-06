"use client";

/* eslint-disable @next/next/no-img-element -- Library previews display original user-uploaded media. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Edge } from "@xyflow/react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { StudioShell } from "./StudioShell";
import { Dialog } from "./Dialog";
import { useLocalValue } from "./storage";
import {
  exampleEdges,
  exampleNodes,
  newProject,
  templates,
  readLocal,
  storeLocal,
  request,
  type Template as MarketTemplate,
  type Order,
  type LibraryAsset,
  type StudioNode,
} from "./data";
import "./marketspace.css";

type OwnWork = { template: MarketTemplate; saved: boolean };
type ProjectSummary = { id: string; name: string };

type Subject = {
  id: string;
  name: string;
  type: string;
  brief: string;
  sellingPoints: string[];
  targetAudience: string;
};
const titles: Record<string, { name: string; description: string }> = {
  market: { name: "Templates", description: "Browse workflows and manage your templates; purchases are demos." },
  subjects: { name: "Bounties", description: "Post a product brief or choose one to start an ad project." },
  orders: { name: "Orders", description: "Your demo template purchases and creative activity." },
  assets: { name: "My assets", description: "" },
};

export function CommerceWorkspace({
  section,
  marketView = "store",
}: {
  section: string;
  marketView?: "store" | "own";
}) {
  const router = useRouter();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [savedTemplates, setSavedTemplates] = useLocalValue<MarketTemplate[]>(
    "sparkle:templates",
    [],
  );
  // Templates saved before publication states existed were explicitly published.
  const allTemplates: MarketTemplate[] = [...templates, ...savedTemplates];
  const catalog = allTemplates.filter((template) => template.published !== false);
  const [detail, setDetail] = useState<MarketTemplate | null>(null);
  const [editingWork, setEditingWork] = useState<OwnWork | null>(null);
  const [matchingWork, setMatchingWork] = useState<MarketTemplate | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [createSubject, setCreateSubject] = useState(false);
  const [orders, setOrders] = useLocalValue<Order[]>("sparkle:orders", []);
  const [assets, setAssets] = useLocalValue<LibraryAsset[]>(
    "sparkle:assets",
    [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [projectPicker, setProjectPicker] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [projectRefresh, setProjectRefresh] = useState(0);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const title = titles[section] || titles.market;

  useEffect(() => {
    let active = true;
    if (section === "subjects")
      request<{ subjects: Subject[] }>("/api/subjects")
        .then((data) => {
          if (active) {
            setSubjects(data.subjects);
            setSubjectsLoaded(true);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [section]);

  useEffect(() => {
    if (section !== "market") return;
    let active = true;
    request<{ projects: ProjectSummary[] }>("/api/projects")
      .then((data) => {
        if (active) setProjects(data.projects);
      })
      .catch((e) => {
        if (active) setProjectsError(e.message);
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section, projectRefresh]);

  const ownWorks: OwnWork[] = [
    ...savedTemplates.map((template) => ({ template, saved: true })),
    ...projects
      .filter(
        (project) => !savedTemplates.some((template) => template.projectId === project.id),
      )
      .map((project) => ({
        saved: false,
        template: {
          id: `template:${project.id}`,
          projectId: project.id,
          name: project.name,
          description: "",
          category: "Community",
          image: "/studio-object.svg",
          price: 0,
          published: false,
        },
      })),
  ];

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function applyTemplate(template: MarketTemplate) {
    await run(async () => {
      const id = await newProject(
        "template",
        template.name.slice(0, 50),
        template.nodes || exampleNodes(),
        "t2v",
        undefined,
        template.edges ?? (template.nodes ? [] : exampleEdges()),
      );
      if (template.price > 0) {
        const order: Order = {
          id: crypto.randomUUID(),
          name: template.name,
          amount: template.price,
          kind: "Demo template purchase",
          date: new Date().toISOString(),
        };
        const next = [...readLocal<Order[]>("sparkle:orders", []), order];
        storeLocal("sparkle:orders", next);
        setOrders(next);
      }
      router.push(`/project/${id}`);
    });
  }
  async function fromSubject(subject: Subject) {
    await run(async () => {
      const nodes: StudioNode[] = [
        {
          id: crypto.randomUUID(),
          type: "asset",
          position: { x: 100, y: 80 },
          data: {
            kind: "text",
            label: subject.name,
            caption: "Merchant brief",
            content: `${subject.brief}\n\nSelling points\n${subject.sellingPoints.join("\n")}\n\nAudience\n${subject.targetAudience}`,
            subjectId: subject.id,
          },
        },
        {
          id: crypto.randomUUID(),
          type: "asset",
          position: { x: 495, y: 80 },
          data: {
            kind: "image",
            label: "Product reference",
            caption: "Add the product you want to promote",
          },
        },
      ];
      const id = await newProject(
        "free",
        subject.name.slice(0, 50),
        nodes,
        "t2v",
        subject.id,
      );
      router.push(`/project/${id}`);
    });
  }
  async function submitSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      const result = await request<{ subject: Subject }>("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          type: data.get("type"),
          brief: data.get("brief"),
          targetAudience: data.get("audience"),
          sellingPoints: String(data.get("sellingPoints"))
            .split("\n")
            .filter(Boolean),
        }),
      });
      setSubjects([result.subject, ...subjects]);
      setSubjectsLoaded(true);
      setCreateSubject(false);
    });
  }
  async function uploadFile(file?: File) {
    if (!file) return;
    await run(async () => {
      const form = new FormData();
      form.append("file", file);
      const asset = await request<LibraryAsset>("/api/studio/upload", {
        method: "POST",
        body: form,
      });
      const next = [...readLocal<LibraryAsset[]>("sparkle:assets", []), asset];
      storeLocal("sparkle:assets", next);
      setAssets(next);
      setNotice("Your asset is ready to use.");
    });
    if (fileInput.current) fileInput.current.value = "";
  }
  async function selectProject() {
    await run(async () => {
      const data = await request<{ projects: typeof projects }>(
        "/api/projects",
      );
      setProjects(data.projects);
      setProjectPicker(true);
    });
  }
  async function addToProject(projectId?: string) {
    if (!selectedAsset) return;
    await run(async () => {
      const node: StudioNode = {
        id: crypto.randomUUID(),
        type: "asset",
        position: { x: 150, y: 150 },
        data: {
          kind: selectedAsset.kind,
          label: selectedAsset.name,
          url: selectedAsset.url,
        },
      };
      if (!projectId)
        projectId = await newProject("free", selectedAsset.name.slice(0, 50), [
          node,
        ]);
      else {
        const { project } = await request<{
          project: { canvas: { nodes: StudioNode[]; edges: unknown[] } };
        }>(`/api/projects/${projectId}`);
        node.position = {
          x: 120 + project.canvas.nodes.length * 35,
          y: 100 + project.canvas.nodes.length * 30,
        };
        await request(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes: [...project.canvas.nodes, node],
            edges: project.canvas.edges,
          }),
        });
      }
      router.push(`/project/${projectId}`);
    });
  }
  async function saveWork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingWork) return;
    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const published =
      submitter instanceof HTMLButtonElement && submitter.value === "publish";
    await run(async () => {
      let template = { ...editingWork.template };
      if (!editingWork.saved && template.projectId) {
        const { project } = await request<{
          project: { canvas: { nodes: StudioNode[]; edges: Edge[] } };
        }>(`/api/projects/${template.projectId}`);
        template = {
          ...template,
          nodes: project.canvas.nodes,
          edges: project.canvas.edges,
          image:
            project.canvas.nodes.find((node) => node.data.kind === "image" && node.data.url)?.data.url ||
            template.image,
        };
      }
      const name = String(form.get("name") || "").trim();
      const price = Number(form.get("price"));
      if (!name || !Number.isFinite(price) || price < 0) {
        throw new Error("Enter a name and a valid non-negative price.");
      }
      template = {
        ...template,
        name,
        description: String(form.get("description") || "").trim(),
        category: String(form.get("category")),
        price,
        published,
      };
      const current = readLocal<MarketTemplate[]>("sparkle:templates", []);
      const exists = current.some((item) => item.id === template.id);
      setSavedTemplates(
        exists
          ? current.map((item) => item.id === template.id ? template : item)
          : [...current, template],
      );
      setEditingWork(null);
      setNotice(
        published
          ? "Template published in this browser's marketplace."
          : "Draft saved. It is not listed in the marketplace.",
      );
    });
  }
  async function unpublishWork(template: MarketTemplate) {
    await run(async () => {
      const current = readLocal<MarketTemplate[]>("sparkle:templates", []);
      setSavedTemplates(
        current.map((item) => item.id === template.id ? { ...item, published: false } : item),
      );
      setNotice("Template unpublished. Your draft is still in My templates.");
    });
  }
  const filteredTemplates = catalog.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <StudioShell pageTitle={title.name} description={title.description} actions={
        <>
          {section === "market" && (
            <div
              className="marketspace-switch"
              role="group"
              aria-label="Template view"
            >
              <button
                aria-pressed={marketView === "store"}
                onClick={() => router.replace("/commercial/market")}
              >
                Templates
              </button>
              <button
                aria-pressed={marketView === "own"}
                onClick={() => router.replace("/commercial/market?view=own")}
              >
                My templates <span>{ownWorks.length}</span>
              </button>
            </div>
          )}
          {section === "subjects" && (
            <button
              className="primary-button compact"
              onClick={() => setCreateSubject(true)}
            >
              New bounty <Plus size={15} />
            </button>
          )}
          {section === "assets" && (
            <button
              className="primary-button compact"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? "Uploading..." : "Upload asset"}
              <Upload size={15} />
            </button>
          )}
        </>
    }>
      <main className="commerce-page marketspace-page page-scroll">
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {section === "market" && marketView === "own" && (
          <section className="marketspace-own" aria-label="My templates">
            {projectsLoading && <p role="status">Loading workspace projects...</p>}
            {projectsError && (
              <div className="marketspace-load-error" role="alert">
                <p>Could not load workspace projects: {projectsError}</p>
                <button
                  className="secondary-button compact"
                  onClick={() => {
                    setProjectsError("");
                    setProjectsLoading(true);
                    setProjectRefresh((value) => value + 1);
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <div className="marketspace-work-list">
              {ownWorks.map((work) => (
                <article className="marketspace-work" key={work.template.id}>
                  <img src={work.template.image} alt="" />
                  <div className="marketspace-work-body">
                    <div className="marketspace-work-heading">
                      <h3>{work.template.name}</h3>
                      <span className={`marketspace-state ${work.template.published !== false ? "is-published" : ""}`}>
                        {work.template.published !== false ? "Published" : "Draft / unpublished"}
                      </span>
                    </div>
                    <p>{work.template.description || "Add a description before sharing this workflow."}</p>
                    <small>{work.saved ? "Saved template snapshot" : "Workspace project - not saved as a template"}</small>
                    <div className="marketspace-work-actions">
                      <button
                        className="secondary-button compact"
                        disabled={busy}
                        onClick={() => {
                          setError("");
                          setEditingWork(work);
                        }}
                      >
                        {work.saved ? "Edit template" : "Save draft"}
                      </button>
                      {work.template.published !== false ? (
                        <button
                          className="secondary-button compact"
                          disabled={busy}
                          onClick={() => void unpublishWork(work.template)}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          className="secondary-button compact"
                          disabled={busy}
                          onClick={() => {
                            setError("");
                            setEditingWork(work);
                          }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        className="primary-button compact"
                        disabled={busy}
                        onClick={() => {
                          setError("");
                          setMatchingWork(work.template);
                        }}
                      >
                        Content matching <ArrowUpRight size={13} />
                      </button>
                      {work.template.projectId && (
                        <Link
                          className="marketspace-project-link"
                          href={`/project/${work.template.projectId}`}
                        >
                          Open project <ArrowUpRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!ownWorks.length && !projectsLoading && !projectsError && (
              <div className="empty-state">
                <h3>No work yet</h3>
                <p>Create a project from a template. It will appear here as unpublished work.</p>
                <button className="secondary-button" onClick={() => router.replace("/commercial/market")}>
                  Browse templates
                </button>
              </div>
            )}
          </section>
        )}
        {section === "market" && marketView === "store" && (
          <>
            <div className="commerce-tabs">
              {["All", "Product", "Brand", "Lifestyle", "Community"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={category === tab ? "active" : ""}
                    onClick={() => setCategory(tab)}
                  >
                    {tab}
                  </button>
                ),
              )}
              <label className="search-input">
                <Search size={14} />
                <input
                  aria-label="Search templates"
                  placeholder="Find a template"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="market-grid">
              {filteredTemplates.map((template) => (
                <article key={template.id} className="market-card">
                  <button
                    className="market-image"
                    onClick={() => setDetail(template)}
                    aria-label={`View ${template.name}`}
                  >
                    <img src={template.image} alt={template.name} />
                    <span>{template.category}</span>
                  </button>
                  <div className="market-card-body">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <div className="market-card-footer">
                      <span>
                        {template.price
                          ? `$${template.price}`
                          : "Free template"}
                      </span>
                      <button onClick={() => setDetail(template)}>
                        View workflow <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filteredTemplates.length && (
              <div className="empty-state">
                <h3>No templates found.</h3>
                <p>Try a different category or search.</p>
              </div>
            )}
          </>
        )}
        {section === "subjects" && (
          <>
            {!subjectsLoaded && !error && <p role="status">Loading bounties...</p>}
            <div className="subject-grid">
              {subjects.map((subject, i) => (
                <article className="subject-card" key={subject.id}>
                  <header>
                    <span className="eyebrow">
                      BOUNTY {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="tag">{subject.type}</span>
                  </header>
                  <h3>{subject.name}</h3>
                  <p>
                    {subject.brief ||
                      "Add a brief to shape your creative direction."}
                  </p>
                  <div className="selling-points">
                    {subject.sellingPoints.map((point) => (
                      <span key={point}>{point}</span>
                    ))}
                  </div>
                  <footer>
                    <small>
                      {subject.targetAudience || "Audience not specified"}
                    </small>
                    <button
                      className="secondary-button compact"
                      disabled={busy}
                      onClick={() => void fromSubject(subject)}
                    >
                      Create an ad <ArrowUpRight size={13} />
                    </button>
                  </footer>
                </article>
              ))}
            </div>
            {subjectsLoaded && !subjects.length && (
              <div className="empty-state">
                <h3>No bounties yet</h3>
                <p>Add a merchant brief to give creators a starting point.</p>
                <button className="secondary-button" onClick={() => setCreateSubject(true)}>
                  New bounty <Plus size={14} />
                </button>
              </div>
            )}
          </>
        )}
        {section === "orders" && (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <span>Demo purchases</span>
                <strong>
                  $
                  {orders
                    .reduce((sum, order) => sum + order.amount, 0)
                    .toFixed(2)}
                </strong>
                <p>No real charges</p>
              </div>
              <div className="stat-card">
                <span>Creative activity</span>
                <strong>{orders.length.toString().padStart(2, "0")}</strong>
                <p>Saved in this browser</p>
              </div>
              <div className="stat-card">
                <span>Withdrawable earnings</span>
                <strong>$0.00</strong>
                <p>Payments not connected</p>
              </div>
            </div>
            {orders.length ? (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Project or template</th>
                    <th>Activity</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .slice()
                    .reverse()
                    .map((order) => (
                      <tr key={order.id}>
                        <td>{order.name}</td>
                        <td>{order.kind}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>${order.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <h3>No orders yet</h3>
                <p>Demo template purchases will appear here.</p>
                <Link className="secondary-button" href="/commercial/market">
                  Explore the template market <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
        {section === "assets" && (
          <>
            <div className="commerce-tabs">
              {["All", "image", "video", "audio"].map((tab) => (
                <button
                  key={tab}
                  className={category === tab ? "active" : ""}
                  onClick={() => setCategory(tab)}
                >
                  {tab === "All"
                    ? "All assets"
                    : tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {assets.length ? (
              <div className="market-grid">
                {assets
                  .filter(
                    (asset) => category === "All" || asset.kind === category,
                  )
                  .map((asset) => (
                    <article key={asset.id} className="market-card">
                      {asset.kind === "image" ? (
                        <img
                          className="asset-library-preview"
                          src={asset.url}
                          alt={asset.name}
                        />
                      ) : asset.kind === "video" ? (
                        <video
                          className="asset-library-preview"
                          src={asset.url}
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <div className="asset-library-preview">
                          <audio src={asset.url} controls />
                        </div>
                      )}
                      <div className="market-card-body">
                        <h3>{asset.name}</h3>
                        <p>{asset.kind} · Your uploaded asset</p>
                        <div className="market-card-footer">
                          <a href={asset.url} target="_blank" rel="noreferrer">
                            Open original
                          </a>
                          <button onClick={() => setSelectedAsset(asset)}>
                            Use asset <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No assets yet</h3>
                <button
                  className="secondary-button"
                  onClick={() => fileInput.current?.click()}
                >
                  Upload your first asset <Upload size={14} />
                </button>
              </div>
            )}
          </>
        )}
        <input
          type="file"
          ref={fileInput}
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
          onChange={(e) => void uploadFile(e.target.files?.[0])}
        />
        {detail && (
          <Dialog
            title="An editable starting point"
            onClose={() => {
              setDetail(null);
              setError("");
            }}
            wide
          >
            <div className="detail-preview">
              <img src={detail.image} alt={detail.name} />
              <div>
                <span className="eyebrow">{detail.category} WORKFLOW</span>
                <h3>{detail.name}</h3>
                <p>{detail.description}</p>
                <div className="detail-meta">
                  <span>Brief · Visuals · Shot list</span>
                  <strong>{detail.price ? `$${detail.price}` : "Free"}</strong>
                </div>
                <p>
                  Open this workflow on your canvas. Replace the product, revise
                  the copy and build your own edit.
                </p>
                <p className="form-note">
                  {detail.price
                    ? "Demo checkout only. This records a preview order and creates a project. You will not be charged."
                    : "Creates an editable project in your workspace."}
                </p>
                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void applyTemplate(detail)}
                >
                  {busy
                    ? "Creating your project..."
                    : detail.price
                      ? "Demo purchase and use"
                      : "Use this template"}
                  <ArrowUpRight size={15} />
                </button>
                <small>
                  Text, image and video generation requires a configured provider.
                  Final MP4 rendering is not available.
                </small>
              </div>
            </div>
          </Dialog>
        )}
        {createSubject && (
          <Dialog
            title="New creative bounty"
            onClose={() => setCreateSubject(false)}
          >
            <form className="studio-form" onSubmit={submitSubject}>
              <p className="form-note">
                Describe your merchant brief for creators. This saves a brand
                subject, not a paid commission.
              </p>
              <label>
                Name
                <input
                  required
                  name="name"
                  maxLength={80}
                  placeholder="Your product or campaign"
                />
              </label>
              <label>
                Type
                <select name="type">
                  <option value="product">Product</option>
                  <option value="campaign">Campaign</option>
                  <option value="brand">Brand</option>
                  <option value="service">Service</option>
                  <option value="ip">Creative IP</option>
                </select>
              </label>
              <label>
                Merchant brief
                <textarea
                  required
                  name="brief"
                  placeholder="What are you promoting? What should the ad communicate?"
                />
              </label>
              <label>
                Key selling points
                <textarea
                  name="sellingPoints"
                  placeholder="One selling point per line"
                />
              </label>
              <label>
                Target audience
                <input name="audience" placeholder="Who is this for?" />
              </label>
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
              <button disabled={busy} className="primary-button">
                {busy ? "Saving..." : "Save bounty"}
              </button>
            </form>
          </Dialog>
        )}
        {editingWork && (
          <Dialog
            title="Template details"
            onClose={() => setEditingWork(null)}
          >
            <form className="studio-form" onSubmit={saveWork}>
              <p className="form-note">
                Save a private draft or deliberately publish to the local
                marketplace. Publishing does not collect payments or share work
                with other users.
              </p>
              <label>
                Name
                <input required name="name" maxLength={80} defaultValue={editingWork.template.name} />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  maxLength={2000}
                  defaultValue={editingWork.template.description}
                  placeholder="What does this workflow help someone create?"
                />
              </label>
              <label>
                Category
                <select name="category" defaultValue={editingWork.template.category}>
                  {[...new Set(["Community", "Product", "Brand", "Lifestyle", editingWork.template.category])].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Demo price (USD)
                <input
                  required
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingWork.template.price}
                />
              </label>
              <p className="form-note">
                {editingWork.saved
                  ? "Edits keep the saved canvas snapshot, including its nodes and connections."
                  : "Saving copies the project's latest saved nodes and connections into a template snapshot."}
                {" "}Saving as a draft also removes any published listing.
              </p>
              {error && <p className="error-message" role="alert">{error}</p>}
              <div className="marketspace-form-actions">
                <button className="secondary-button" type="submit" value="draft" disabled={busy}>
                  Save draft
                </button>
                <button className="primary-button" type="submit" value="publish" disabled={busy}>
                  {busy ? "Saving..." : "Publish template"} <ArrowUpRight size={14} />
                </button>
              </div>
            </form>
          </Dialog>
        )}
        {matchingWork && (
          <Dialog title="Give your work a little context" onClose={() => setMatchingWork(null)} wide>
            <ContentMatching work={matchingWork} busy={busy} creationError={error} onCreate={fromSubject} />
          </Dialog>
        )}
        {selectedAsset && !projectPicker && (
          <Dialog
            title="Create with this asset"
            onClose={() => setSelectedAsset(null)}
          >
            <p className="dialog-intro">{selectedAsset.name}</p>
            <button
              className="primary-button full-width"
              disabled={busy}
              onClick={() => void addToProject()}
            >
              Start a new canvas <Plus size={15} />
            </button>
            <button
              className="secondary-button full-width"
              style={{ marginTop: 12 }}
              disabled={busy}
              onClick={() => void selectProject()}
            >
              Add to an existing project <ArrowRight size={15} />
            </button>
            {error && <p role="alert">{error}</p>}
          </Dialog>
        )}
        {projectPicker && (
          <Dialog
            title="Choose a project"
            onClose={() => setProjectPicker(false)}
          >
            {projects.map((project) => (
              <button
                className="picker-item"
                disabled={busy}
                key={project.id}
                onClick={() => void addToProject(project.id)}
              >
                {project.name}
                <Plus size={15} />
              </button>
            ))}
            {!projects.length && (
              <p className="dialog-intro">
                No projects yet. Start a new canvas with this asset.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
          </Dialog>
        )}
        {notice && (
          <div className="studio-toast" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>
    </StudioShell>
  );
}

function ContentMatching({
  work,
  busy,
  creationError,
  onCreate,
}: {
  work: MarketTemplate;
  busy: boolean;
  creationError: string;
  onCreate: (subject: Subject) => Promise<void>;
}) {
  const [context, setContext] = useState(
    `${work.name}\n${work.description}`.trim(),
  );
  const [results, setResults] = useState<
    { subject: Subject; keywords: string[] }[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function match(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const keywords = [
      ...new Set(context.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)),
    ];
    setError("");
    setResults(null);
    if (!keywords.length) {
      setError("Add at least one keyword describing your work.");
      return;
    }
    setLoading(true);
    try {
      const { subjects } = await request<{ subjects: Subject[] }>("/api/subjects");
      setResults(
        subjects
          .map((subject) => {
            const text = `${subject.name} ${subject.type} ${subject.brief} ${subject.sellingPoints.join(" ")} ${subject.targetAudience}`.toLowerCase();
            return {
              subject,
              keywords: keywords.filter((keyword) => text.includes(keyword)),
            };
          })
          .filter((result) => result.keywords.length)
          .sort((a, b) => b.keywords.length - a.keywords.length),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="marketspace-matching">
      <p className="marketspace-context-name">Work: <strong>{work.name}</strong></p>
      <p className="marketspace-note">
        Describe the product, audience or themes in your work. This preview checks
        your keywords against existing brand subjects from Creative Bounties:
        name, type, merchant brief, selling points and audience. Matching is
        case-insensitive text containment, ordered by the number of matching
        keywords. Separate keywords with spaces or punctuation. No AI analysis,
        media scanning or performance prediction is used.
      </p>
      <form className="studio-form" onSubmit={match}>
        <label>
          Content context
          <textarea
            required
            maxLength={2000}
            value={context}
            disabled={loading}
            onChange={(event) => {
              setContext(event.target.value);
              setResults(null);
              setError("");
            }}
            placeholder="For example: running shoes, urban, commuters"
          />
        </label>
        <button className="primary-button" disabled={loading || busy || !context.trim()}>
          {loading ? "Matching..." : "Find matching bounties"} <ArrowRight size={14} />
        </button>
      </form>
      {(error || creationError) && <p className="error-message" role="alert">{error || creationError}</p>}
      {results !== null && (
        <section className="marketspace-match-results" aria-label="Matching bounties">
          <p role="status">{results.length} matching {results.length === 1 ? "bounty" : "bounties"}</p>
          {results.map(({ subject, keywords }) => (
            <article className="match-row" key={subject.id}>
              <div>
                <h3>{subject.name}</h3>
                <p>{subject.brief}</p>
                <p>Matched keywords: {keywords.join(", ")}</p>
              </div>
              <button
                className="secondary-button compact"
                disabled={busy}
                onClick={() => void onCreate(subject)}
              >
                Create from subject <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
          {!results.length && (
            <div className="empty-state">
              <h3>No matching bounty</h3>
              <p>Try different keywords or add a merchant brief in Creative Bounties.</p>
              <Link className="secondary-button" href="/commercial/subjects">
                View bounties <ArrowUpRight size={13} />
              </Link>
            </div>
          )}
          {!!results.length && (
            <p className="marketspace-note">
              Create from subject starts a new ad project linked to the merchant
              brief. It does not submit or publish your existing work.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
