import { useEffect, useState } from "react";

const API_URL = "https://bpgroup-api-production.up.railway.app";

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_URL}${fileUrl}`;
}

const emptyPlane = {
  registration: "",
  brand: "",
  model: "",
  year: "",
  hours: "",
  observation: ""
};

const emptyMaintenance = {
  maintenance_date: "",
  description: ""
};

const emptyTransaction = {
  transaction_date: "",
  description: "",
  type: "EGRESO",
  amount: ""
};

const emptyGeneral = {
  expense_date: "",
  description: "",
  type: "EGRESO",
  amount: ""
};

export default function AirplanesPage() {
  const token = localStorage.getItem("token");

  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);

  const [airplanes, setAirplanes] = useState([]);
  const [selectedAirplane, setSelectedAirplane] = useState(null);

  const [planeForm, setPlaneForm] = useState(emptyPlane);
  const [editingPlaneId, setEditingPlaneId] = useState(null);

  const [photoFiles, setPhotoFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [airplaneFiles, setAirplaneFiles] = useState([]);

  const [maintenanceList, setMaintenanceList] = useState([]);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  const [generalRecords, setGeneralRecords] = useState([]);
  const [generalBalance, setGeneralBalance] = useState(0);
  const [generalForm, setGeneralForm] = useState(emptyGeneral);

  async function api(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Error en la API");
    }

    return data;
  }

  async function loadAirplanes() {
    try {
      setLoading(true);
      const data = await api("/airplanes");
      setAirplanes(data || []);
    } catch (err) {
      alert(err.message || "Error cargando aviones");
    } finally {
      setLoading(false);
    }
  }

  async function loadAirplaneFull(airplane) {
    setSelectedAirplane(airplane);
    setView("detail");
    await Promise.all([
      loadFiles(airplane.id),
      loadMaintenance(airplane.id),
      loadTransactions(airplane.id)
    ]);
  }

  async function loadFiles(id) {
    const data = await api(`/airplanes/${id}/files`);
    setAirplaneFiles(data || []);
  }

  async function loadMaintenance(id) {
    const data = await api(`/airplanes/${id}/maintenance`);
    setMaintenanceList(data || []);
  }

  async function loadTransactions(id) {
    const data = await api(`/airplanes/${id}/transactions`);
    setBalance(data?.balance || 0);
    setTransactions(data?.transactions || []);
  }

  async function loadGeneral() {
    try {
      setLoading(true);
      const data = await api("/airplanes-general");
      setGeneralBalance(data?.balance || 0);
      setGeneralRecords(data?.records || []);
    } catch (err) {
      alert(err.message || "Error cargando general");
    } finally {
      setLoading(false);
    }
  }

  function openNewPlane() {
    setPlaneForm(emptyPlane);
    setEditingPlaneId(null);
    setPhotoFiles([]);
    setPdfFiles([]);
    setView("form");
  }

  function openEditPlane(airplane) {
    setPlaneForm({
      registration: airplane.registration || "",
      brand: airplane.brand || "",
      model: airplane.model || "",
      year: airplane.year || "",
      hours: airplane.hours || "",
      observation: airplane.observation || ""
    });
    setEditingPlaneId(airplane.id);
    setPhotoFiles([]);
    setPdfFiles([]);
    setView("form");
  }

  async function savePlane() {
    try {
      if (!planeForm.registration.trim()) {
        alert("La matrícula es obligatoria");
        return;
      }

      const payload = {
        registration: planeForm.registration.trim().toUpperCase(),
        brand: planeForm.brand.trim().toUpperCase() || null,
        model: planeForm.model.trim().toUpperCase() || null,
        year: planeForm.year ? Number(planeForm.year) : null,
        hours: planeForm.hours ? Number(planeForm.hours) : 0,
        observation: planeForm.observation.trim() || null
      };

      const url = editingPlaneId
        ? `/airplanes/${editingPlaneId}`
        : "/airplanes";

      const method = editingPlaneId ? "PUT" : "POST";

      const data = await api(url, {
        method,
        body: JSON.stringify(payload)
      });

      const saved = data.airplane;

      if (!editingPlaneId && (photoFiles.length > 0 || pdfFiles.length > 0)) {
        await uploadFiles(saved.id);
      }

      alert(editingPlaneId ? "Avión actualizado" : "Avión creado");
      setView("list");
      await loadAirplanes();
    } catch (err) {
      alert(err.message || "Error guardando avión");
    }
  }

  async function deletePlane(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar este avión?");
    if (!ok) return;

    try {
      await api(`/airplanes/${id}`, { method: "DELETE" });
      alert("Avión eliminado");
      await loadAirplanes();
    } catch (err) {
      alert(err.message || "Error eliminando avión");
    }
  }

  async function uploadFiles(airplaneId = selectedAirplane?.id) {
    if (!airplaneId) return;

    if (photoFiles.length === 0 && pdfFiles.length === 0) {
      alert("Selecciona al menos una foto o PDF");
      return;
    }

    const formData = new FormData();

    photoFiles.forEach((file) => formData.append("photos", file));
    pdfFiles.forEach((file) => formData.append("pdfs", file));

    await api(`/airplanes/${airplaneId}/files`, {
      method: "POST",
      body: formData
    });

    alert("Archivos subidos");
    setPhotoFiles([]);
    setPdfFiles([]);

    if (selectedAirplane) {
      await loadFiles(selectedAirplane.id);
    }
  }

  async function deleteFile(fileId) {
    const ok = window.confirm("¿Eliminar archivo?");
    if (!ok) return;

    await api(`/airplane-files/${fileId}`, { method: "DELETE" });
    await loadFiles(selectedAirplane.id);
  }

  function editMaintenance(item) {
    setEditingMaintenanceId(item.id);
    setMaintenanceForm({
      maintenance_date: formatDate(item.maintenance_date),
      description: item.description || ""
    });
  }

  async function saveMaintenance() {
    try {
      if (!selectedAirplane) return;

      if (!maintenanceForm.maintenance_date || !maintenanceForm.description.trim()) {
        alert("Fecha y descripción son obligatorias");
        return;
      }

      const payload = {
        maintenance_date: maintenanceForm.maintenance_date,
        description: maintenanceForm.description.trim()
      };

      if (editingMaintenanceId) {
        await api(`/airplane-maintenance/${editingMaintenanceId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await api(`/airplanes/${selectedAirplane.id}/maintenance`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setMaintenanceForm(emptyMaintenance);
      setEditingMaintenanceId(null);
      await loadMaintenance(selectedAirplane.id);
    } catch (err) {
      alert(err.message || "Error guardando mantenimiento");
    }
  }

  async function deleteMaintenance(id) {
    const ok = window.confirm("¿Eliminar mantenimiento?");
    if (!ok) return;

    await api(`/airplane-maintenance/${id}`, { method: "DELETE" });
    await loadMaintenance(selectedAirplane.id);
  }

  function editTransaction(item) {
    setEditingTransactionId(item.id);
    setTransactionForm({
      transaction_date: formatDate(item.transaction_date),
      description: item.description || "",
      type: item.type || "EGRESO",
      amount: item.amount || ""
    });
  }

  async function saveTransaction() {
    try {
      if (!selectedAirplane) return;

      if (
        !transactionForm.transaction_date ||
        !transactionForm.description.trim() ||
        !transactionForm.amount
      ) {
        alert("Fecha, descripción y valor son obligatorios");
        return;
      }

      const payload = {
        transaction_date: transactionForm.transaction_date,
        description: transactionForm.description.trim(),
        type: transactionForm.type,
        amount: Number(transactionForm.amount || 0)
      };

      if (editingTransactionId) {
        await api(`/airplane-transactions/${editingTransactionId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await api(`/airplanes/${selectedAirplane.id}/transactions`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setTransactionForm(emptyTransaction);
      setEditingTransactionId(null);
      await loadTransactions(selectedAirplane.id);
    } catch (err) {
      alert(err.message || "Error guardando registro");
    }
  }

  async function deleteTransaction(id) {
    const ok = window.confirm("¿Eliminar registro?");
    if (!ok) return;

    await api(`/airplane-transactions/${id}`, { method: "DELETE" });
    await loadTransactions(selectedAirplane.id);
  }

  async function saveGeneralRecord() {
    try {
      if (!generalForm.expense_date || !generalForm.description.trim() || !generalForm.amount) {
        alert("Fecha, descripción y valor son obligatorios");
        return;
      }

      await api("/airplanes-general", {
        method: "POST",
        body: JSON.stringify({
          expense_date: generalForm.expense_date,
          description: generalForm.description.trim(),
          type: generalForm.type,
          amount: Number(generalForm.amount || 0)
        })
      });

      setGeneralForm(emptyGeneral);
      await loadGeneral();
    } catch (err) {
      alert(err.message || "Error guardando registro general");
    }
  }

  async function deleteGeneralRecord(id) {
    const ok = window.confirm("¿Eliminar registro general?");
    if (!ok) return;

    await api(`/airplanes-general/${id}`, { method: "DELETE" });
    await loadGeneral();
  }

  useEffect(() => {
    loadAirplanes();
  }, []);

  if (view === "form") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MÓDULO AVIONES</p>
            <h1 style={styles.title}>
              {editingPlaneId ? "Editar avión" : "Agregar avión"}
            </h1>
          </div>

          <button style={styles.secondaryButton} onClick={() => setView("list")}>
            Volver
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.grid}>
            <input
              style={styles.input}
              placeholder="Matrícula"
              value={planeForm.registration}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, registration: e.target.value.toUpperCase() })
              }
            />

            <input
              style={styles.input}
              placeholder="Marca"
              value={planeForm.brand}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, brand: e.target.value.toUpperCase() })
              }
            />

            <input
              style={styles.input}
              placeholder="Modelo"
              value={planeForm.model}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, model: e.target.value.toUpperCase() })
              }
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Año"
              value={planeForm.year}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, year: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Horas"
              value={planeForm.hours}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, hours: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Observación"
              value={planeForm.observation}
              onChange={(e) =>
                setPlaneForm({ ...planeForm, observation: e.target.value })
              }
            />
          </div>

          {!editingPlaneId && (
            <div style={styles.uploadBox}>
              <div>
                <label style={styles.label}>Fotos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                />
              </div>

              <div>
                <label style={styles.label}>PDFs</label>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                />
              </div>
            </div>
          )}

          <div style={styles.actionsRight}>
            <button style={styles.primaryButton} onClick={savePlane}>
              {editingPlaneId ? "Actualizar avión" : "Guardar avión"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "general") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>AVIONES · GENERAL</p>
            <h1 style={styles.title}>General de Aviones</h1>
            <p style={styles.subtitle}>
              Pagos de hangar, seguros, permisos y movimientos generales de todos los aviones.
            </p>
          </div>

          <button style={styles.secondaryButton} onClick={() => setView("list")}>
            Volver
          </button>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Balance general</span>
          <strong
            style={{
              ...styles.kpiValue,
              color: Number(generalBalance || 0) >= 0 ? "#176b35" : "#b42318"
            }}
          >
            {money(generalBalance)}
          </strong>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Agregar registro general</h2>

          <div style={styles.grid}>
            <input
              style={styles.input}
              type="date"
              value={generalForm.expense_date}
              onChange={(e) =>
                setGeneralForm({ ...generalForm, expense_date: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Descripción"
              value={generalForm.description}
              onChange={(e) =>
                setGeneralForm({ ...generalForm, description: e.target.value })
              }
            />

            <select
              style={styles.input}
              value={generalForm.type}
              onChange={(e) =>
                setGeneralForm({ ...generalForm, type: e.target.value })
              }
            >
              <option value="INGRESO">Ingreso +</option>
              <option value="EGRESO">Egreso -</option>
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Valor"
              value={generalForm.amount}
              onChange={(e) =>
                setGeneralForm({ ...generalForm, amount: e.target.value })
              }
            />
          </div>

          <div style={styles.actionsRight}>
            <button style={styles.primaryButton} onClick={saveGeneralRecord}>
              Guardar registro
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Historial general</h2>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {generalRecords.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{formatDate(item.expense_date)}</td>
                  <td style={styles.td}>{item.description}</td>
                  <td style={styles.td}>{item.type}</td>
                  <td style={styles.td}>
                    {item.type === "INGRESO" ? "+" : "-"} {money(item.amount)}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteGeneralRecord(item.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {generalRecords.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="5">
                    Sin registros generales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedAirplane) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>AVIÓN</p>
            <h1 style={styles.title}>{selectedAirplane.registration}</h1>
            <p style={styles.subtitle}>
              {selectedAirplane.brand || "-"} · {selectedAirplane.model || "-"} ·{" "}
              {selectedAirplane.year || "-"}
            </p>
          </div>

          <button style={styles.secondaryButton} onClick={() => setView("list")}>
            Volver
          </button>
        </div>

        <div style={styles.detailGrid}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Información</h2>
            <p><b>Matrícula:</b> {selectedAirplane.registration}</p>
            <p><b>Marca:</b> {selectedAirplane.brand || "-"}</p>
            <p><b>Modelo:</b> {selectedAirplane.model || "-"}</p>
            <p><b>Año:</b> {selectedAirplane.year || "-"}</p>
            <p><b>Horas:</b> {selectedAirplane.hours || "0"}</p>
            <p><b>Observación:</b> {selectedAirplane.observation || "-"}</p>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Cuenta del avión</span>
            <strong
              style={{
                ...styles.kpiValue,
                color: Number(balance || 0) >= 0 ? "#176b35" : "#b42318"
              }}
            >
              {money(balance)}
            </strong>
            <small>Balance de ingresos y egresos</small>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Fotos y PDFs</h2>

          <div style={styles.uploadBox}>
            <div>
              <label style={styles.label}>Fotos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
              />
            </div>

            <div>
              <label style={styles.label}>PDFs</label>
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
              />
            </div>

            <button style={styles.primaryButton} onClick={() => uploadFiles()}>
              Subir archivos
            </button>
          </div>

          <div style={styles.filesGrid}>
            {airplaneFiles.map((file) => (
              <div key={file.id} style={styles.fileCard}>
                <b>{file.file_type}</b>
                <p>{file.file_name}</p>

                <a
                  href={resolveFileUrl(file.file_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver archivo
                </a>

                <button
                  style={styles.deleteButton}
                  onClick={() => deleteFile(file.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}

            {airplaneFiles.length === 0 && <p>Sin archivos cargados.</p>}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Reparaciones / Mantenimientos</h2>

          <div style={styles.grid}>
            <input
              style={styles.input}
              type="date"
              value={maintenanceForm.maintenance_date}
              onChange={(e) =>
                setMaintenanceForm({
                  ...maintenanceForm,
                  maintenance_date: e.target.value
                })
              }
            />

            <input
              style={styles.input}
              placeholder="Descripción"
              value={maintenanceForm.description}
              onChange={(e) =>
                setMaintenanceForm({
                  ...maintenanceForm,
                  description: e.target.value
                })
              }
            />
          </div>

          <div style={styles.actionsRight}>
            <button style={styles.primaryButton} onClick={saveMaintenance}>
              {editingMaintenanceId ? "Actualizar mantenimiento" : "Agregar mantenimiento"}
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {maintenanceList.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{formatDate(item.maintenance_date)}</td>
                  <td style={styles.td}>{item.description}</td>
                  <td style={styles.td}>
                    <button style={styles.editButton} onClick={() => editMaintenance(item)}>
                      Editar
                    </button>
                    <button style={styles.deleteButton} onClick={() => deleteMaintenance(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {maintenanceList.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="3">
                    Sin mantenimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Registro de gastos / cuenta bancaria</h2>

          <div style={styles.grid}>
            <input
              style={styles.input}
              type="date"
              value={transactionForm.transaction_date}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  transaction_date: e.target.value
                })
              }
            />

            <input
              style={styles.input}
              placeholder="Descripción"
              value={transactionForm.description}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  description: e.target.value
                })
              }
            />

            <select
              style={styles.input}
              value={transactionForm.type}
              onChange={(e) =>
                setTransactionForm({ ...transactionForm, type: e.target.value })
              }
            >
              <option value="INGRESO">Ingreso +</option>
              <option value="EGRESO">Egreso -</option>
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Valor"
              value={transactionForm.amount}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  amount: e.target.value
                })
              }
            />
          </div>

          <div style={styles.actionsRight}>
            <button style={styles.primaryButton} onClick={saveTransaction}>
              {editingTransactionId ? "Actualizar registro" : "Agregar registro"}
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{formatDate(item.transaction_date)}</td>
                  <td style={styles.td}>{item.description}</td>
                  <td style={styles.td}>{item.type}</td>
                  <td style={styles.td}>
                    {item.type === "INGRESO" ? "+" : "-"} {money(item.amount)}
                  </td>
                  <td style={styles.td}>
                    <button style={styles.editButton} onClick={() => editTransaction(item)}>
                      Editar
                    </button>
                    <button style={styles.deleteButton} onClick={() => deleteTransaction(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="5">
                    Sin registros de cuenta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BP GROUP</p>
          <h1 style={styles.title}>Aviones</h1>
          <p style={styles.subtitle}>
            Administración de aviones, documentos, mantenimientos y cuenta de gastos.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => {
              setView("general");
              loadGeneral();
            }}
          >
            General
          </button>

          <button style={styles.primaryButton} onClick={openNewPlane}>
            Agregar avión
          </button>
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <p>Cargando aviones...</p>
        ) : (
          <div style={styles.airplaneGrid}>
            {airplanes.map((airplane) => (
              <div key={airplane.id} style={styles.airplaneCard}>
                <h2 style={{ margin: 0 }}>{airplane.registration}</h2>
                <p style={styles.subtitle}>
                  {airplane.brand || "-"} · {airplane.model || "-"}
                </p>

                <p><b>Año:</b> {airplane.year || "-"}</p>
                <p><b>Horas:</b> {airplane.hours || "0"}</p>

                <div style={styles.cardActions}>
                  <button
                    style={styles.viewButton}
                    onClick={() => loadAirplaneFull(airplane)}
                  >
                    Ver
                  </button>

                  <button
                    style={styles.editButton}
                    onClick={() => openEditPlane(airplane)}
                  >
                    Editar
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() => deletePlane(airplane.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {airplanes.length === 0 && <p>No hay aviones registrados.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 28,
    minHeight: "100vh",
    background: "#f6f1e8"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap"
  },
  headerActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#9a6a24"
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 44px)",
    fontWeight: 900
  },
  subtitle: {
    color: "#665f55",
    marginTop: 8
  },
  card: {
    background: "#fff",
    border: "1px solid #e8dcc7",
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.07)"
  },
  kpiCard: {
    background: "#fff",
    border: "1px solid #e8dcc7",
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.07)"
  },
  kpiLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 900,
    color: "#6b6258",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  kpiValue: {
    display: "block",
    fontSize: 34,
    marginTop: 8
  },
  sectionTitle: {
    marginTop: 0
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 16
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16
  },
  airplaneGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16
  },
  airplaneCard: {
    border: "1px solid #eadfcd",
    borderRadius: 18,
    padding: 18,
    background: "#fffaf2"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #d7cbb6",
    outline: "none",
    fontSize: 15
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 8
  },
  uploadBox: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    alignItems: "end",
    marginTop: 18,
    marginBottom: 18
  },
  filesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12
  },
  fileCard: {
    border: "1px solid #eadfcd",
    borderRadius: 16,
    padding: 14,
    background: "#fffaf2"
  },
  primaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer"
  },
  secondaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#b88935",
    color: "#1b1307",
    fontWeight: 900,
    cursor: "pointer"
  },
  viewButton: {
    border: "none",
    borderRadius: 12,
    padding: "9px 12px",
    background: "#111",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },
  editButton: {
    border: "none",
    borderRadius: 12,
    padding: "9px 12px",
    background: "#e0bd73",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
    marginLeft: 8
  },
  deleteButton: {
    border: "none",
    borderRadius: 12,
    padding: "9px 12px",
    background: "#b42318",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    marginLeft: 8
  },
  actionsRight: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 10
  },
  cardActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 14
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 16
  },
  th: {
    background: "#111",
    color: "#fff",
    padding: 10,
    textAlign: "left"
  },
  td: {
    borderBottom: "1px solid #eadfcd",
    padding: 10,
    background: "#fff"
  }
};