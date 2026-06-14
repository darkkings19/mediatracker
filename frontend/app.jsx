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

        function getToken() { return localStorage.getItem("mediatracker_token"); }

        function setToken(t) { localStorage.setItem("mediatracker_token", t); }

        function clearToken() { localStorage.removeItem("mediatracker_token"); }

        async function authFetch(url, options = {}) {
            const token = getToken();
            const headers = { ...options.headers };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            if (!(options.body instanceof FormData) && options.body) headers["Content-Type"] = "application/json";
            return fetch(url, { ...options, headers });
        }

        function App() {
            const [user, setUser] = useState(null);
            const [authLoading, setAuthLoading] = useState(true);
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

            useEffect(() => {
                const token = getToken();
                if (token) {
                    authFetch(`${API_BASE}/auth/me`)
                        .then(r => r.ok ? r.json() : null)
                        .then(u => { if (u) setUser(u); else clearToken(); })
                        .catch(() => clearToken())
                        .finally(() => setAuthLoading(false));
                } else {
                    setAuthLoading(false);
                }
            }, []);

            const activeConfig = categories[view];
            const isCategory = Boolean(activeConfig);

            useEffect(() => {
                if (user) {
                    loadDashboard();
                }
            }, [user]);

            useEffect(() => {
                if (isCategory && user) {
                    setPage(1);
                    loadItems();
                }
            }, [view, search, statusFilter]);

            useEffect(() => {
                if (isCategory && user && view) {
                    loadItems();
                }
            }, [page]);

            function notify(message, type = "success") {
                setToast({ message, type });
                setTimeout(() => setToast(null), 3500);
            }

            async function loadDashboard() {
                try {
                    const response = await authFetch(`${API_BASE}/dashboard`);
                    if (response.ok) setDashboard(await response.json());
                } catch { notify("No se pudo cargar el resumen.", "danger"); }
            }

            async function loadItems() {
                try {
                    const params = new URLSearchParams();
                    if (search.trim()) params.set("titulo", search.trim());
                    if (statusFilter) params.set("estado", statusFilter);
                    if (page > 1) params.set("skip", (page - 1) * limit);
                    params.set("limit", String(limit));
                    const suffix = params.toString() ? `?${params.toString()}` : "";
                    const response = await authFetch(`${API_BASE}/${view}${suffix}`);
                    if (response.ok) {
                        const data = await response.json();
                        setItems(data.items || []);
                        setTotalItemsCount(data.total || 0);
                    }
                } catch { notify("No se pudo cargar la vista.", "danger"); }
            }

            function openView(key) {
                const route = pageRoutes[key] || pageRoutes.dashboard;
                const currentPage = window.location.pathname.split("/").pop() || "index.html";
                if (currentPage !== route) { window.location.href = route; return; }
                setView(key);
                setItems([]);
                setTotalItemsCount(0);
                setPage(1);
                setSearch("");
                setStatusFilter("");
                resetForm();
            }

            function resetForm() { setForm(initialForm); setEditingId(null); }

            function setField(field, value) { setForm((c) => ({ ...c, [field]: value })); }

            function endpoint() { return `${API_BASE}/${view}`; }

            function buildPayload() {
                const p = { titulo: form.titulo.trim(), genero: form.genero.trim() || null, estado: form.estado, observacion: form.observacion.trim() || null };
                if (activeConfig.fields.includes("plataforma")) p.plataforma = form.plataforma.trim() || null;
                if (activeConfig.progress) p.nota_progreso = form.estado === "en progreso" ? (form.nota_progreso.trim() || null) : null;
                if (activeConfig.fields.includes("volumen")) p.volumen = form.volumen ? Number(form.volumen) : null;
                if (activeConfig.fields.includes("capitulos")) p.capitulos = form.capitulos ? Number(form.capitulos) : null;
                if (activeConfig.fields.includes("paginas")) p.paginas = form.paginas ? Number(form.paginas) : null;
                return p;
            }

            async function saveItem(e) {
                e.preventDefault();
                if (!form.titulo.trim()) { notify("El título es obligatorio.", "danger"); return; }
                try {
                    const target = editingId ? `${endpoint()}/${editingId}` : endpoint();
                    const response = await authFetch(target, {
                        method: editingId ? "PUT" : "POST",
                        body: JSON.stringify(buildPayload())
                    });
                    if (!response.ok) { const err = await response.json(); notify(err.detail || "No se pudo guardar.", "danger"); return; }
                    notify(editingId ? "Registro actualizado." : "Registro creado.");
                    resetForm();
                    loadItems();
                    loadDashboard();
                } catch { notify("Error de conexión al guardar.", "danger"); }
            }

            function editItem(item) {
                setEditingId(item.id);
                setForm({
                    titulo: item.titulo || "", genero: item.genero || "", plataforma: item.plataforma || "",
                    estado: item.estado || "pendiente", nota_progreso: item.nota_progreso || "",
                    observacion: item.observacion || "", volumen: item.volumen || "",
                    capitulos: item.capitulos || "", paginas: item.paginas || ""
                });
            }

            async function deleteItem() {
                if (!deleteId) return;
                try {
                    const response = await authFetch(`${endpoint()}/${deleteId}`, { method: "DELETE" });
                    if (response.ok) { notify("Registro eliminado."); setDeleteId(null); loadItems(); loadDashboard(); }
                    else { notify("No se pudo eliminar.", "danger"); }
                } catch { notify("Error de conexión al eliminar.", "danger"); }
            }

            const totalItems = useMemo(() =>
                Object.keys(categories).reduce((s, k) => s + ((dashboard[k] && dashboard[k].total) || 0), 0),
            [dashboard]);

            const activeItems = useMemo(() =>
                Object.keys(categories).reduce((s, k) => {
                    const cfg = categories[k];
                    return s + ((dashboard[k] && dashboard[k][cfg.counterKey]) || 0);
                }, 0),
            [dashboard]);

            function logout() {
                clearToken();
                setUser(null);
                setItems([]);
                setDashboard({});
            }

            if (authLoading) {
                return (
                    <div className="d-flex justify-content-center align-items-center vh-100">
                        <div className="spinner-border text-light" role="status"></div>
                    </div>
                );
            }

            if (!user) {
                return <LoginView onLogin={(u) => { setUser(u); loadDashboard(); }} />;
            }

            return (
                <div className={`app-shell${view === "dashboard" ? " app-shell--wide" : ""}`}>
                    {view !== "dashboard" && (
                        <aside className="sidebar">
                            <div className="brand">
                                <div className="brand-mark"><i className="bi bi-collection-play-fill"></i></div>
                                <div>
                                    <div className="brand-title">MediaTracker</div>
                                    <div className="brand-subtitle">{user.username}</div>
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

                            <div className="nav-label" style={{ marginTop: "auto", paddingTop: "24px" }}>Cuenta</div>
                            <button className="nav-btn" onClick={logout} style={{ color: "var(--muted)" }}>
                                <i className="bi bi-box-arrow-left"></i> Cerrar sesión
                            </button>
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
                            <Dashboard dashboard={dashboard} totalItems={totalItems} activeItems={activeItems} openView={openView} user={user} onLogout={logout} />
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

        function LoginView({ onLogin }) {
            const [isRegister, setIsRegister] = useState(false);
            const [username, setUsername] = useState("");
            const [password, setPassword] = useState("");
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState("");

            async function handleSubmit(e) {
                e.preventDefault();
                setLoading(true);
                setError("");
                try {
                    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        setError(data.detail || "Error de autenticación.");
                        setLoading(false);
                        return;
                    }
                    setToken(data.access_token);
                    onLogin(data.user);
                } catch {
                    setError("Error de conexión.");
                    setLoading(false);
                }
            }

            return (
                <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "var(--bg-grad)" }}>
                    <div className="panel p-4" style={{ width: "400px", maxWidth: "90vw" }}>
                        <div className="text-center mb-4">
                            <div className="app-icon-header mx-auto mb-3" style={{ width: "60px", height: "60px", fontSize: "1.6rem" }}>
                                <i className="bi bi-collection-play-fill"></i>
                            </div>
                            <h3 className="fw-bold" style={{ color: "var(--text)" }}>MediaTracker</h3>
                            <p className="text-secondary small">{isRegister ? "Crear cuenta nueva" : "Inicia sesión"}</p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Usuario</label>
                                <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Contraseña</label>
                                <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            {error && <div className="alert alert-danger py-2 small">{error}</div>}
                            <button className="btn btn-main w-100 py-2" type="submit" disabled={loading}>
                                {loading ? "Cargando..." : (isRegister ? "Crear cuenta" : "Iniciar sesión")}
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <button className="btn btn-link text-secondary small p-0" onClick={() => { setIsRegister(!isRegister); setError(""); }}>
                                {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        function Dashboard({ dashboard, totalItems, activeItems, user, onLogout }) {
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
                        <div className="d-flex gap-2 align-items-center">
                            <span className="text-secondary small fw-bold">{user.username}</span>
                            <button className="btn btn-outline-secondary btn-sm" onClick={onLogout} title="Cerrar sesión">
                                <i className="bi bi-box-arrow-left me-1"></i>Salir
                            </button>
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
            const { config, items, totalItemsCount, page, setPage, limit, search, setSearch, statusFilter, setStatusFilter, form, setField, saveItem, editItem, setDeleteId, resetForm, editingId, view } = props;
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
                                    {config.states.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => { setSearch(""); setStatusFilter(""); }}>Limpiar</button>
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
                                                <td><ItemDetail item={item} view={view} /></td>
                                                <td><StatusBadge value={item.estado} /></td>
                                                <td className="text-end">
                                                    <button className="btn btn-outline-warning btn-icon me-2" onClick={() => editItem(item)} title="Editar"><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-outline-danger btn-icon" onClick={() => setDeleteId(item.id)} title="Eliminar"><i className="bi bi-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {totalPages > 1 && (
                                <nav className="pagination-nav">
                                    <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <span className="pagination-info">{page} / {totalPages}</span>
                                    <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </nav>
                            )}
                        </div>

                        <FormPanel config={config} form={form} setField={setField} saveItem={saveItem} resetForm={resetForm} editingId={editingId} view={view} />
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
            let c = "status-pendiente";
            if (["en progreso"].includes(value)) c = "status-progreso";
            if (["completado", "vista"].includes(value)) c = "status-completado";
            if (["abandonado", "abandonada"].includes(value)) c = "status-abandonado";
            return <span className={`status-badge ${c}`}>{value}</span>;
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
                                {config.states.map((s) => <option key={s} value={s}>{s}</option>)}
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
                            <button className="btn btn-outline-secondary w-100 mt-2" type="button" onClick={resetForm}>Cancelar edición</button>
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
