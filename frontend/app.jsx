const { useEffect, useMemo, useState } = React;
        const API_BASE = "/api";
        const pageRoutes = {
            dashboard: "index.html",
            series: "series.html",
            novelas: "novelas.html",
            peliculas: "peliculas.html",
            mangas: "mangas.html"
        };
        const initialPageView = document.body.dataset.view || "dashboard";

const categories = {
    series: {
        label: "Series",
        title: "Series de TV",
        icon: "bi-tv-fill",
        color: "var(--neon-purple)",
        activeLabel: "viendo actualmente",
        counterKey: "in_progress",
        states: ["pendiente", "en progreso", "completado", "abandonado"],
        progress: true,
        fields: ["plataforma"]
    },
    novelas: {
        label: "Novelas",
        title: "Novelas ligeras",
        icon: "bi-book-half",
        color: "var(--cyan)",
        activeLabel: "leyendo actualmente",
        counterKey: "in_progress",
        states: ["pendiente", "en progreso", "completado", "abandonado"],
        progress: true,
        fields: ["volumen", "capitulos", "paginas"]
    },
    peliculas: {
        label: "Películas",
        title: "Películas",
        icon: "bi-film",
        color: "var(--magenta)",
        activeLabel: "pendientes por ver",
        counterKey: "pending",
        states: ["pendiente", "vista", "abandonada"],
        progress: false,
        fields: ["plataforma"]
    },
    mangas: {
        label: "Mangas",
        title: "Mangas",
        icon: "bi-journal-richtext",
        color: "var(--electric-lime)",
        activeLabel: "leyendo actualmente",
        counterKey: "in_progress",
        states: ["pendiente", "en progreso", "completado", "abandonado"],
        progress: true,
        fields: ["capitulos"]
    }
};

        const initialForm = {
            titulo: "",
            genero: "",
            plataforma: "",
            estado: "pendiente",
            nota_progreso: "",
            observacion: "",
            volumen: "",
            capitulos: "",
            paginas: ""
        };

        function App() {
            const [view, setView] = useState(initialPageView);
            const [dashboard, setDashboard] = useState({});
            const [items, setItems] = useState([]);
            const [totalItemsCount, setTotalItemsCount] = useState(0);
            const [page, setPage] = useState(1);
            const [search, setSearch] = useState("");
            const [statusFilter, setStatusFilter] = useState("");
            const [form, setForm] = useState(initialForm);
            const [editingId, setEditingId] = useState(null);
            const [deleteId, setDeleteId] = useState(null);
            const [toast, setToast] = useState(null);
            const limit = 10;

            const activeConfig = categories[view];
            const isCategory = Boolean(activeConfig);

            useEffect(() => {
                loadDashboard();
            }, []);

            useEffect(() => {
                if (isCategory) {
                    setPage(1);
                    loadItems();
                }
            }, [view, search, statusFilter]);

            useEffect(() => {
                if (isCategory && view) {
                    loadItems();
                }
            }, [page]);

            function notify(message, type = "success") {
                setToast({ message, type });
                setTimeout(() => setToast(null), 3500);
            }

            async function loadDashboard() {
                try {
                    const response = await fetch(`${API_BASE}/dashboard`);
                    if (response.ok) {
                        setDashboard(await response.json());
                    }
                } catch {
                    notify("No se pudo cargar el resumen.", "danger");
                }
            }

            async function loadItems() {
                try {
                    const params = new URLSearchParams();
                    if (search.trim()) params.set("titulo", search.trim());
                    if (statusFilter) params.set("estado", statusFilter);
                    if (page > 1) params.set("skip", (page - 1) * limit);
                    params.set("limit", String(limit));
                    const suffix = params.toString() ? `?${params.toString()}` : "";
                    const response = await fetch(`${API_BASE}/${view}${suffix}`);
                    if (response.ok) {
                        const data = await response.json();
                        setItems(data.items || []);
                        setTotalItemsCount(data.total || 0);
                    }
                } catch {
                    notify("No se pudo cargar la vista.", "danger");
                }
            }

            function openView(key) {
                const route = pageRoutes[key] || pageRoutes.dashboard;
                const currentPage = window.location.pathname.split("/").pop() || "index.html";
                if (currentPage !== route) {
                    window.location.href = route;
                    return;
                }
                setView(key);
                setItems([]);
                setTotalItemsCount(0);
                setPage(1);
                setSearch("");
                setStatusFilter("");
                resetForm();
            }

            function resetForm() {
                setForm(initialForm);
                setEditingId(null);
            }

            function setField(field, value) {
                setForm((current) => ({ ...current, [field]: value }));
            }

            function endpoint() {
                return `${API_BASE}/${view}`;
            }

            function buildPayload() {
                const payload = {
                    titulo: form.titulo.trim(),
                    genero: form.genero.trim() || null,
                    estado: form.estado,
                    observacion: form.observacion.trim() || null
                };

                if (activeConfig.fields.includes("plataforma")) {
                    payload.plataforma = form.plataforma.trim() || null;
                }

                if (activeConfig.progress) {
                    payload.nota_progreso = form.estado === "en progreso" ? (form.nota_progreso.trim() || null) : null;
                }

                if (activeConfig.fields.includes("volumen")) {
                    payload.volumen = form.volumen ? Number(form.volumen) : null;
                }

                if (activeConfig.fields.includes("capitulos")) {
                    payload.capitulos = form.capitulos ? Number(form.capitulos) : null;
                }

                if (activeConfig.fields.includes("paginas")) {
                    payload.paginas = form.paginas ? Number(form.paginas) : null;
                }

                return payload;
            }

            async function saveItem(event) {
                event.preventDefault();

                if (!form.titulo.trim()) {
                    notify("El título es obligatorio.", "danger");
                    return;
                }

                if (form.volumen && Number(form.volumen) < 0) {
                    notify("El volumen no puede ser negativo.", "danger");
                    return;
                }

                if (form.capitulos && Number(form.capitulos) < 0) {
                    notify("Los capítulos no pueden ser negativos.", "danger");
                    return;
                }

                if (form.paginas && Number(form.paginas) < 0) {
                    notify("Las páginas no pueden ser negativas.", "danger");
                    return;
                }

                try {
                    const target = editingId ? `${endpoint()}/${editingId}` : endpoint();
                    const response = await fetch(target, {
                        method: editingId ? "PUT" : "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(buildPayload())
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        notify(error.detail || "No se pudo guardar.", "danger");
                        return;
                    }

                    notify(editingId ? "Registro actualizado." : "Registro creado.");
                    resetForm();
                    loadItems();
                    loadDashboard();
                } catch {
                    notify("Error de conexión al guardar.", "danger");
                }
            }

            function editItem(item) {
                setEditingId(item.id);
                setForm({
                    titulo: item.titulo || "",
                    genero: item.genero || "",
                    plataforma: item.plataforma || "",
                    estado: item.estado || "pendiente",
                    nota_progreso: item.nota_progreso || "",
                    observacion: item.observacion || "",
                    volumen: item.volumen || "",
                    capitulos: item.capitulos || "",
                    paginas: item.paginas || ""
                });
            }

            async function deleteItem() {
                if (!deleteId) return;

                try {
                    const response = await fetch(`${endpoint()}/${deleteId}`, { method: "DELETE" });
                    if (response.ok) {
                        notify("Registro eliminado.");
                        setDeleteId(null);
                        loadItems();
                        loadDashboard();
                    } else {
                        notify("No se pudo eliminar.", "danger");
                    }
                } catch {
                    notify("Error de conexión al eliminar.", "danger");
                }
            }

            const totalItems = useMemo(() => {
                return Object.keys(categories).reduce((sum, key) => sum + ((dashboard[key] && dashboard[key].total) || 0), 0);
            }, [dashboard]);

            const activeItems = useMemo(() => {
                return Object.keys(categories).reduce((sum, key) => {
                    const config = categories[key];
                    return sum + ((dashboard[key] && dashboard[key][config.counterKey]) || 0);
                }, 0);
            }, [dashboard]);

            return (
                <div className={`app-shell${view === "dashboard" ? " app-shell--wide" : ""}`}>
                    {view !== "dashboard" && (
                    <aside className="sidebar">
                        <div className="brand">
                            <div className="brand-mark"><i className="bi bi-collection-play-fill"></i></div>
                            <div>
                                <div className="brand-title">MediaTracker</div>
                                <div className="brand-subtitle">Panel de escritorio</div>
                            </div>
                        </div>

                        <div className="nav-label">Principal</div>
                        <a className={`nav-btn ${view === "dashboard" ? "active" : ""}`} href={pageRoutes.dashboard}>
                            <i className="bi bi-grid-1x2-fill"></i> Resumen general
                        </a>

                        <div className="nav-label">Categorías</div>
                        {Object.entries(categories).map(([key, config]) => (
                            <a key={key} className={`nav-btn ${view === key ? "active" : ""}`} href={pageRoutes[key]} title={config.title}>
                                <i className={`bi ${config.icon}`} style={{ color: config.color }}></i> {config.label}
                            </a>
                        ))}
                    </aside>
                    )}

                    <main className="content">
                        {toast && (
                            <div className="toast-box">
                                <i className={`bi ${toast.type === "danger" ? "bi-exclamation-triangle-fill text-danger" : "bi-check-circle-fill text-success"} me-2`}></i>
                                {toast.message}
                            </div>
                        )}

                        {view === "dashboard" ? (
                            <Dashboard dashboard={dashboard} totalItems={totalItems} activeItems={activeItems} openView={openView} />
                        ) : (
                            <CategoryView
                                config={activeConfig}
                                items={items}
                                totalItemsCount={totalItemsCount}
                                page={page}
                                setPage={setPage}
                                limit={limit}
                                search={search}
                                setSearch={setSearch}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                form={form}
                                setField={setField}
                                saveItem={saveItem}
                                editItem={editItem}
                                setDeleteId={setDeleteId}
                                resetForm={resetForm}
                                editingId={editingId}
                                view={view}
                            />
                        )}

                        {deleteId && (
                            <div className="modal-backdrop-local">
                                <div className="panel confirm-modal">
                                    <h5 className="fw-bold mb-2">Confirmar eliminación</h5>
                                    <p className="text-secondary mb-4">Este registro se eliminará definitivamente.</p>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button className="btn btn-outline-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
                                        <button className="btn btn-danger" onClick={deleteItem}>Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            );
        }

        function Dashboard({ dashboard, totalItems, activeItems }) {
            return (
                <>
                    <header className="topbar">
                        <div className="d-flex align-items-center gap-3">
                            <div className="app-icon-header"><i className="bi bi-collection-play-fill"></i></div>
                            <div>
                                <div className="eyebrow">Vista principal</div>
                                <h1 className="page-title">Resumen de entretenimiento</h1>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <div className="panel px-3 py-2">
                                <span className="text-secondary small fw-bold me-2">Total</span>
                                <span className="fw-bold">{totalItems}</span>
                            </div>
                            <div className="panel px-3 py-2">
                                <span className="text-secondary small fw-bold me-2">Activos</span>
                                <span className="fw-bold">{activeItems}</span>
                            </div>
                        </div>
                    </header>

                    <section className="summary-grid">
                        {Object.entries(categories).map(([key, config]) => {
                            const count = dashboard[key] || {};
                            const total = count.total || 0;
                            const selected = count[config.counterKey] || 0;
                            const ratio = total > 0 ? Math.round((selected / total) * 100) : 0;
                            return (
                                <article key={key} className="panel summary-card">
                                    <div className="summary-icon" style={{ color: config.color }}>
                                        <i className={`bi ${config.icon}`}></i>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between">
                                        <div>
                                            <div className="summary-number">{total}</div>
                                            <div className="summary-text">{config.title}</div>
                                        </div>
                                    </div>
                                    <div className="summary-comparison">
                                        <div className="d-flex justify-content-between gap-2">
                                            <span>{selected} {config.activeLabel}</span>
                                            <span>{ratio}%</span>
                                        </div>
                                        <div className="meter">
                                            <div className="meter-fill" style={{ width: `${ratio}%`, background: config.color }}></div>
                                        </div>
                                        <div className="summary-text">{selected} de {total} registros</div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    <section className="featured-categories">
                        <div className="icon-card-grid">
                            {Object.entries(categories).map(([key, config]) => (
                                <a className="icon-card" href={pageRoutes[key]} key={key} style={{ color: config.color }} title={config.title}>
                                    <i className={`bi ${config.icon}`}></i>
                                </a>
                            ))}
                        </div>
                    </section>

                    <section className="latest-items">
                        <div className="latest-grid">
                            {Object.entries(categories).map(([key, config]) => {
                                const count = dashboard[key] || {};
                                const ultimo = count.ultimo;
                                return (
                                    <a className="latest-card" href={pageRoutes[key]} key={key} style={{ borderLeftColor: config.color }}>
                                        <div className="latest-label" style={{ color: config.color }}>{config.title}</div>
                                        {ultimo ? (
                                            <div className="latest-title" title={ultimo.actualizado_en ? new Date(ultimo.actualizado_en).toLocaleString() : ""}>{ultimo.titulo}</div>
                                        ) : (
                                            <div className="latest-empty">Sin registros</div>
                                        )}
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                </>
            );
        }

        function CategoryView(props) {
            const {
                config, items, totalItemsCount, page, setPage, limit,
                search, setSearch, statusFilter, setStatusFilter, form, setField,
                saveItem, editItem, setDeleteId, resetForm, editingId, view
            } = props;

            const totalPages = Math.max(1, Math.ceil(totalItemsCount / limit));

            return (
                <>
                    <header className="topbar">
                        <div className="d-flex align-items-center gap-3">
                            <a className="home-icon-btn" href={pageRoutes.dashboard} title="Volver al inicio">
                                <i className="bi bi-grid-1x2-fill"></i>
                            </a>
                            <div>
                                <div className="eyebrow">Vista de categoría</div>
                                <h1 className="page-title">{config.title}</h1>
                            </div>
                        </div>
                        <button className="btn btn-main px-3" onClick={resetForm}>
                            <i className="bi bi-plus-lg me-2"></i>Nuevo registro
                        </button>
                    </header>

                    <section className="workspace-grid">
                        <div className="panel">
                            <div className="toolbar">
                                <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título" />
                                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">Todos los estados</option>
                                    {config.states.map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => { setSearch(""); setStatusFilter(""); }}>
                                    Limpiar
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <div className="empty-state">
                                    <i className={`bi ${config.icon} fs-2 d-block mb-2`}></i>
                                    Sin registros en esta vista.
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Detalle</th>
                                            <th>Estado</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="title-cell">{item.titulo}</div>
                                                    <div className="sub-cell">{item.genero || "Sin género"}</div>
                                                </td>
                                                <td>
                                                    <ItemDetail item={item} view={view} />
                                                </td>
                                                <td><StatusBadge value={item.estado} /></td>
                                                <td className="text-end">
                                                    <button className="btn btn-outline-warning btn-icon me-2" onClick={() => editItem(item)} title="Editar">
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button className="btn btn-outline-danger btn-icon" onClick={() => setDeleteId(item.id)} title="Eliminar">
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {totalPages > 1 && (
                                <nav className="pagination-nav">
                                    <button className="btn btn-outline-secondary btn-sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <span className="pagination-info">{page} / {totalPages}</span>
                                    <button className="btn btn-outline-secondary btn-sm"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(page + 1)}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </nav>
                            )}
                        </div>

                        <FormPanel
                            config={config}
                            form={form}
                            setField={setField}
                            saveItem={saveItem}
                            resetForm={resetForm}
                            editingId={editingId}
                            view={view}
                        />
                    </section>
                </>
            );
        }

        function ItemDetail({ item, view }) {
            const details = [];
            if (item.plataforma) details.push(`Plataforma: ${item.plataforma}`);
            if (item.volumen) details.push(`Volumen: ${item.volumen}`);
            if (item.capitulos) details.push(`Capítulos: ${item.capitulos}`);
            if (item.paginas) details.push(`Páginas: ${item.paginas}`);

            return (
                <div>
                    <div>{details.length ? details.join(" · ") : <span className="text-secondary">Sin detalle</span>}</div>
                    {item.nota_progreso && <div className="sub-cell">Progreso: {item.nota_progreso}</div>}
                    {item.observacion && <div className="sub-cell">Obs: {item.observacion}</div>}
                </div>
            );
        }

        function StatusBadge({ value }) {
            let className = "status-pendiente";
            if (["en progreso"].includes(value)) className = "status-progreso";
            if (["completado", "vista"].includes(value)) className = "status-completado";
            if (["abandonado", "abandonada"].includes(value)) className = "status-abandonado";
            return <span className={`status-badge ${className}`}>{value}</span>;
        }

        function FormPanel({ config, form, setField, saveItem, resetForm, editingId }) {
            return (
                <aside className="panel form-panel">
                    <div className="form-title">{editingId ? "Editar registro" : "Crear registro"}</div>
                    <form onSubmit={saveItem}>
                        <Field label="Título *">
                            <input className="form-control" value={form.titulo} onChange={(e) => setField("titulo", e.target.value)} maxLength="200" required />
                        </Field>

                        <Field label="Género">
                            <input className="form-control" value={form.genero} onChange={(e) => setField("genero", e.target.value)} />
                        </Field>

                        {config.fields.includes("volumen") && (
                            <Field label="Volumen">
                                <input className="form-control" type="number" min="0" value={form.volumen} onChange={(e) => setField("volumen", e.target.value)} />
                            </Field>
                        )}

                        {(config.fields.includes("capitulos") || config.fields.includes("paginas")) && (
                            <div className="row">
                                {config.fields.includes("capitulos") && (
                                    <div className={config.fields.includes("paginas") ? "col-6" : "col-12"}>
                                        <Field label="Capítulos">
                                            <input className="form-control" type="number" min="0" value={form.capitulos} onChange={(e) => setField("capitulos", e.target.value)} />
                                        </Field>
                                    </div>
                                )}
                                {config.fields.includes("paginas") && (
                                    <div className="col-6">
                                        <Field label="Páginas">
                                            <input className="form-control" type="number" min="0" value={form.paginas} onChange={(e) => setField("paginas", e.target.value)} />
                                        </Field>
                                    </div>
                                )}
                            </div>
                        )}

                        {config.fields.includes("plataforma") && (
                            <Field label="Plataforma">
                                <input className="form-control" value={form.plataforma} onChange={(e) => setField("plataforma", e.target.value)} />
                            </Field>
                        )}

                        <Field label="Estado *">
                            <select className="form-select" value={form.estado} onChange={(e) => setField("estado", e.target.value)}>
                                {config.states.map((state) => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </Field>

                        {config.progress && form.estado === "en progreso" && (
                            <Field label="Nota de progreso">
                                <input className="form-control" value={form.nota_progreso} onChange={(e) => setField("nota_progreso", e.target.value)} maxLength="300" />
                            </Field>
                        )}

                        <Field label="Observaciones">
                            <textarea className="form-control" rows="3" value={form.observacion} onChange={(e) => setField("observacion", e.target.value)}></textarea>
                        </Field>

                        <button className="btn btn-main w-100 py-2 mt-2" type="submit">
                            <i className="bi bi-save me-2"></i>{editingId ? "Actualizar" : "Guardar"}
                        </button>
                        {editingId && (
                            <button className="btn btn-outline-secondary w-100 mt-2" type="button" onClick={resetForm}>
                                Cancelar edición
                            </button>
                        )}
                    </form>
                </aside>
            );
        }

        function Field({ label, children }) {
            return (
                <div className="mb-3">
                    <label className="form-label">{label}</label>
                    {children}
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById("root")).render(<App />);
