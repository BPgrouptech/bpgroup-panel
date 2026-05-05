import { useEffect, useState } from "react";

const API_URL = "https://bpgroup-api-production.up.railway.app";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function number(value) {
  return Number(value || 0).toLocaleString("es-MX");
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnly(value) {
  return String(value || "").slice(0, 10);
}

export default function FarmFinancePage() {
  const token = localStorage.getItem("token");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);

  const [savingPayroll, setSavingPayroll] = useState(false);
  const [savingExpenses, setSavingExpenses] = useState(false);
  const [savingChemical, setSavingChemical] = useState(false);

  const [summary, setSummary] = useState({
    total_cuts: 0,
    total_boxes: 0,
    total_income: 0,
    chemicals_fertilizers: 0,
    electricity: 0,
    fuel: 0,
    maintenance: 0,
    other_expenses: 0,
    total_payroll: 0,
    direct_expenses: 0,
    total_expenses: 0,
    profit: 0
  });

  const [payrollForm, setPayrollForm] = useState({
    week_date: todayString(),
    total_payroll: "",
    observation: ""
  });
  const [editingPayrollId, setEditingPayrollId] = useState(null);
  const [payrollRows, setPayrollRows] = useState([]);

  const [expensesForm, setExpensesForm] = useState({
    week_date: todayString(),
    electricity: "",
    fuel: "",
    maintenance: "",
    other_expenses: "",
    observation: ""
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseRows, setExpenseRows] = useState([]);

  const [chemicalForm, setChemicalForm] = useState({
    expense_date: todayString(),
    type: "",
    product: "",
    amount: "",
    observation: ""
  });
  const [editingChemicalId, setEditingChemicalId] = useState(null);
  const [chemicalRows, setChemicalRows] = useState([]);

  async function api(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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

  async function loadSummary() {
    setLoading(true);

    try {
      const data = await api(`/farms-finance/monthly-summary?year=${year}&month=${month}`);
      setSummary(data || {});
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cargando resumen");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistories() {
    try {
      const [payrollData, expensesData, chemicalsData] = await Promise.all([
        api(`/weekly-payroll?year=${year}&month=${month}`),
        api(`/weekly-expenses?year=${year}&month=${month}`),
        api(`/chemicals?year=${year}&month=${month}`)
      ]);

      setPayrollRows(payrollData || []);
      setExpenseRows(expensesData || []);
      setChemicalRows(chemicalsData || []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cargando historial");
    }
  }

  async function reloadAll() {
    await loadSummary();
    await loadHistories();
  }

  function resetPayrollForm() {
    setPayrollForm({
      week_date: todayString(),
      total_payroll: "",
      observation: ""
    });
    setEditingPayrollId(null);
  }

  function resetExpensesForm() {
    setExpensesForm({
      week_date: todayString(),
      electricity: "",
      fuel: "",
      maintenance: "",
      other_expenses: "",
      observation: ""
    });
    setEditingExpenseId(null);
  }

  function resetChemicalForm() {
    setChemicalForm({
      expense_date: todayString(),
      type: "",
      product: "",
      amount: "",
      observation: ""
    });
    setEditingChemicalId(null);
  }

  async function savePayroll() {
    try {
      if (!payrollForm.week_date) {
        alert("Selecciona la fecha de la semana");
        return;
      }

      setSavingPayroll(true);

      const path = editingPayrollId
        ? `/weekly-payroll/${editingPayrollId}`
        : "/weekly-payroll";

      const method = editingPayrollId ? "PUT" : "POST";

      await api(path, {
        method,
        body: JSON.stringify({
          week_date: payrollForm.week_date,
          total_payroll: Number(payrollForm.total_payroll || 0),
          observation: payrollForm.observation || null
        })
      });

      alert(editingPayrollId ? "Pago semanal actualizado" : "Pago semanal guardado");
      resetPayrollForm();
      await reloadAll();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando pago semanal");
    } finally {
      setSavingPayroll(false);
    }
  }

  async function saveExpenses() {
    try {
      if (!expensesForm.week_date) {
        alert("Selecciona la fecha de la semana");
        return;
      }

      setSavingExpenses(true);

      const path = editingExpenseId
        ? `/weekly-expenses/${editingExpenseId}`
        : "/weekly-expenses";

      const method = editingExpenseId ? "PUT" : "POST";

      await api(path, {
        method,
        body: JSON.stringify({
          week_date: expensesForm.week_date,
          electricity: Number(expensesForm.electricity || 0),
          fuel: Number(expensesForm.fuel || 0),
          maintenance: Number(expensesForm.maintenance || 0),
          other_expenses: Number(expensesForm.other_expenses || 0),
          observation: expensesForm.observation || null
        })
      });

      alert(editingExpenseId ? "Gasto semanal actualizado" : "Gasto semanal guardado");
      resetExpensesForm();
      await reloadAll();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando gastos semanales");
    } finally {
      setSavingExpenses(false);
    }
  }

  async function saveChemical() {
    try {
      if (!chemicalForm.expense_date) {
        alert("Selecciona la fecha");
        return;
      }

      if (!chemicalForm.type) {
        alert("Selecciona si es QUÍMICO o FERTILIZANTE");
        return;
      }

      setSavingChemical(true);

      const path = editingChemicalId
        ? `/chemicals/${editingChemicalId}`
        : "/chemicals";

      const method = editingChemicalId ? "PUT" : "POST";

      await api(path, {
        method,
        body: JSON.stringify({
          expense_date: chemicalForm.expense_date,
          type: chemicalForm.type,
          product: chemicalForm.product || null,
          amount: Number(chemicalForm.amount || 0),
          observation: chemicalForm.observation || null
        })
      });

      alert(editingChemicalId ? "Registro actualizado" : "Registro guardado");
      resetChemicalForm();
      await reloadAll();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando químico/fertilizante");
    } finally {
      setSavingChemical(false);
    }
  }

  function editPayroll(row) {
    setEditingPayrollId(row.id);
    setPayrollForm({
      week_date: dateOnly(row.week_date),
      total_payroll: row.total_payroll || "",
      observation: row.observation || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editExpense(row) {
    setEditingExpenseId(row.id);
    setExpensesForm({
      week_date: dateOnly(row.week_date),
      electricity: row.electricity || "",
      fuel: row.fuel || "",
      maintenance: row.maintenance || "",
      other_expenses: row.other_expenses || "",
      observation: row.observation || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editChemical(row) {
    setEditingChemicalId(row.id);
    setChemicalForm({
      expense_date: dateOnly(row.expense_date),
      type: row.type || "",
      product: row.product || "",
      amount: row.amount || "",
      observation: row.observation || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletePayroll(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar este pago semanal?");
    if (!ok) return;

    try {
      await api(`/weekly-payroll/${id}`, { method: "DELETE" });
      if (editingPayrollId === id) resetPayrollForm();
      await reloadAll();
    } catch (err) {
      alert(err.message || "Error eliminando pago semanal");
    }
  }

  async function deleteExpense(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar este gasto semanal?");
    if (!ok) return;

    try {
      await api(`/weekly-expenses/${id}`, { method: "DELETE" });
      if (editingExpenseId === id) resetExpensesForm();
      await reloadAll();
    } catch (err) {
      alert(err.message || "Error eliminando gasto semanal");
    }
  }

  async function deleteChemical(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar este químico/fertilizante?");
    if (!ok) return;

    try {
      await api(`/chemicals/${id}`, { method: "DELETE" });
      if (editingChemicalId === id) resetChemicalForm();
      await reloadAll();
    } catch (err) {
      alert(err.message || "Error eliminando químico/fertilizante");
    }
  }

  useEffect(() => {
    reloadAll();
  }, [year, month]);

  const costPerBox =
    Number(summary.total_boxes || 0) > 0
      ? Number(summary.total_expenses || 0) / Number(summary.total_boxes || 0)
      : 0;

  const profitPerBox =
    Number(summary.total_boxes || 0) > 0
      ? Number(summary.profit || 0) / Number(summary.total_boxes || 0)
      : 0;

  const isProfitPositive = Number(summary.profit || 0) >= 0;

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>BP GROUP · HUERTAS</p>
          <h1 style={styles.title}>Finanzas de Huertas</h1>
          <p style={styles.subtitle}>
            Control semanal de gastos con resumen mensual automático de ingresos,
            gastos, pago de personal, químicos/fertilizantes y utilidad.
          </p>
        </div>

        <div style={styles.periodCard}>
          <label style={styles.label}>Periodo del resumen</label>

          <div style={styles.periodControls}>
            <input
              style={styles.inputSmall}
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Año"
            />

            <select
              style={styles.inputSmall}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <button style={styles.darkButton} onClick={reloadAll}>
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Cajas producidas</span>
          <strong style={styles.kpiValue}>{number(summary.total_boxes)}</strong>
          <small style={styles.kpiHint}>{number(summary.total_cuts)} cortes registrados</small>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Ingreso total</span>
          <strong style={styles.kpiValue}>{money(summary.total_income)}</strong>
          <small style={styles.kpiHint}>Ventas completas del mes</small>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Gasto total</span>
          <strong style={styles.kpiValue}>{money(summary.total_expenses)}</strong>
          <small style={styles.kpiHint}>Gastos semanales + químicos + personal</small>
        </div>

        <div
          style={{
            ...styles.kpiCard,
            borderColor: isProfitPositive ? "#b7e2c2" : "#f1b4b4",
            background: isProfitPositive
              ? "linear-gradient(180deg, #ffffff, #effaf2)"
              : "linear-gradient(180deg, #ffffff, #fff0f0)"
          }}
        >
          <span style={styles.kpiLabel}>Utilidad</span>
          <strong
            style={{
              ...styles.kpiValue,
              color: isProfitPositive ? "#176b35" : "#b42318"
            }}
          >
            {money(summary.profit)}
          </strong>
          <small style={styles.kpiHint}>
            {isProfitPositive ? "Resultado positivo" : "Resultado negativo"}
          </small>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingPayrollId ? "Editar pago semanal" : "Pago de personal semanal"}
              </h2>
              <p style={styles.sectionText}>
                Ingresa cada pago semanal. El resumen mensual suma automáticamente
                todos los pagos cuya fecha cae dentro del mes seleccionado.
              </p>
            </div>
          </div>

          <div style={styles.expenseGridTwo}>
            <div style={styles.field}>
              <label style={styles.label}>Fecha de la semana</label>
              <input
                style={styles.input}
                type="date"
                value={payrollForm.week_date}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, week_date: e.target.value })
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Pago total del personal</label>
              <input
                style={styles.input}
                type="number"
                value={payrollForm.total_payroll}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, total_payroll: e.target.value })
                }
                placeholder="Ej: 250000"
              />
            </div>

            <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Observación</label>
              <input
                style={styles.input}
                value={payrollForm.observation}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, observation: e.target.value })
                }
                placeholder="Detalle opcional"
              />
            </div>
          </div>

          <div style={styles.actionsRight}>
            {editingPayrollId && (
              <button style={styles.lightButton} onClick={resetPayrollForm}>
                Cancelar edición
              </button>
            )}
            <button
              style={styles.goldButton}
              onClick={savePayroll}
              disabled={savingPayroll}
            >
              {savingPayroll
                ? "Guardando..."
                : editingPayrollId
                  ? "Actualizar personal"
                  : "Guardar personal"}
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingExpenseId ? "Editar gasto semanal" : "Gastos semanales globales"}
              </h2>
              <p style={styles.sectionText}>
                Luz, combustible, mantenimiento y otros gastos se guardan por semana.
                El resumen mensual suma los registros del mes seleccionado.
              </p>
            </div>
          </div>

          <div style={styles.expenseGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Fecha de la semana</label>
              <input
                style={styles.input}
                type="date"
                value={expensesForm.week_date}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, week_date: e.target.value })
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Luz</label>
              <input
                style={styles.input}
                type="number"
                value={expensesForm.electricity}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, electricity: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Combustible</label>
              <input
                style={styles.input}
                type="number"
                value={expensesForm.fuel}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, fuel: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mantenimiento</label>
              <input
                style={styles.input}
                type="number"
                value={expensesForm.maintenance}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, maintenance: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Otros gastos</label>
              <input
                style={styles.input}
                type="number"
                value={expensesForm.other_expenses}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, other_expenses: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Observación</label>
              <input
                style={styles.input}
                value={expensesForm.observation}
                onChange={(e) =>
                  setExpensesForm({ ...expensesForm, observation: e.target.value })
                }
                placeholder="Detalle opcional"
              />
            </div>
          </div>

          <div style={styles.actionsRight}>
            {editingExpenseId && (
              <button style={styles.lightButton} onClick={resetExpensesForm}>
                Cancelar edición
              </button>
            )}
            <button
              style={styles.darkButton}
              onClick={saveExpenses}
              disabled={savingExpenses}
            >
              {savingExpenses
                ? "Guardando..."
                : editingExpenseId
                  ? "Actualizar gastos"
                  : "Guardar gastos"}
            </button>
          </div>
        </section>
      </div>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              {editingChemicalId ? "Editar químico/fertilizante" : "Químicos y fertilizantes"}
            </h2>
            <p style={styles.sectionText}>
              Aquí se registran químicos y fertilizantes separados de los gastos globales.
              El resumen mensual suma los montos por fecha.
            </p>
          </div>
        </div>

        <div style={styles.expenseGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Fecha</label>
            <input
              style={styles.input}
              type="date"
              value={chemicalForm.expense_date}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, expense_date: e.target.value })
              }
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tipo</label>
            <select
              style={styles.input}
              value={chemicalForm.type}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, type: e.target.value })
              }
            >
              <option value="">Seleccionar</option>
              <option value="QUIMICO">Químico</option>
              <option value="FERTILIZANTE">Fertilizante</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Producto</label>
            <input
              style={styles.input}
              value={chemicalForm.product}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, product: e.target.value.toUpperCase() })
              }
              placeholder="Ej: UREA / GLIFOSATO"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Monto</label>
            <input
              style={styles.input}
              type="number"
              value={chemicalForm.amount}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, amount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div style={{ ...styles.field, gridColumn: "span 2" }}>
            <label style={styles.label}>Observación</label>
            <input
              style={styles.input}
              value={chemicalForm.observation}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, observation: e.target.value.toUpperCase() })
              }
              placeholder="Detalle opcional"
            />
          </div>
        </div>

        <div style={styles.actionsRight}>
          {editingChemicalId && (
            <button style={styles.lightButton} onClick={resetChemicalForm}>
              Cancelar edición
            </button>
          )}
          <button
            style={styles.darkButton}
            onClick={saveChemical}
            disabled={savingChemical}
          >
            {savingChemical
              ? "Guardando..."
              : editingChemicalId
                ? "Actualizar registro"
                : "Guardar químico/fertilizante"}
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Resumen mensual global</h2>
            <p style={styles.sectionText}>
              {MONTHS[Number(month) - 1]} {year} · Todas las huertas existentes.
            </p>
          </div>

          <div style={styles.miniStats}>
            <div>
              <span style={styles.kpiLabel}>Costo por caja</span>
              <strong>{money(costPerBox)}</strong>
            </div>

            <div>
              <span style={styles.kpiLabel}>Utilidad por caja</span>
              <strong>{money(profitPerBox)}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <p style={styles.loading}>Cargando información...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cortes</th>
                  <th style={styles.th}>Cajas</th>
                  <th style={styles.th}>Ingreso</th>
                  <th style={styles.th}>Químicos/Fert.</th>
                  <th style={styles.th}>Luz</th>
                  <th style={styles.th}>Combustible</th>
                  <th style={styles.th}>Mantenimiento</th>
                  <th style={styles.th}>Otros</th>
                  <th style={styles.th}>Personal</th>
                  <th style={styles.th}>Gasto total</th>
                  <th style={styles.th}>Utilidad</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td style={styles.td}>{number(summary.total_cuts)}</td>
                  <td style={styles.td}>{number(summary.total_boxes)}</td>
                  <td style={styles.td}>{money(summary.total_income)}</td>
                  <td style={styles.td}>{money(summary.chemicals_fertilizers)}</td>
                  <td style={styles.td}>{money(summary.electricity)}</td>
                  <td style={styles.td}>{money(summary.fuel)}</td>
                  <td style={styles.td}>{money(summary.maintenance)}</td>
                  <td style={styles.td}>{money(summary.other_expenses)}</td>
                  <td style={styles.td}>{money(summary.total_payroll)}</td>
                  <td style={styles.td}>{money(summary.total_expenses)}</td>
                  <td
                    style={{
                      ...styles.td,
                      fontWeight: 900,
                      color: isProfitPositive ? "#176b35" : "#b42318"
                    }}
                  >
                    {money(summary.profit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div style={styles.historyGrid}>
        <HistorySection
          title="Historial de pagos semanales"
          empty="No hay pagos registrados en este mes."
          columns={["Fecha", "Personal", "Observación", "Acciones"]}
          rows={payrollRows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={styles.td}>{dateOnly(row.week_date)}</td>
              <td style={styles.td}>{money(row.total_payroll)}</td>
              <td style={styles.td}>{row.observation || "-"}</td>
              <td style={styles.tdActions}>
                <button style={styles.editButton} onClick={() => editPayroll(row)}>
                  Editar
                </button>
                <button style={styles.deleteButton} onClick={() => deletePayroll(row.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          )}
        />

        <HistorySection
          title="Historial de gastos semanales"
          empty="No hay gastos registrados en este mes."
          columns={["Fecha", "Luz", "Combustible", "Mant.", "Otros", "Observación", "Acciones"]}
          rows={expenseRows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={styles.td}>{dateOnly(row.week_date)}</td>
              <td style={styles.td}>{money(row.electricity)}</td>
              <td style={styles.td}>{money(row.fuel)}</td>
              <td style={styles.td}>{money(row.maintenance)}</td>
              <td style={styles.td}>{money(row.other_expenses)}</td>
              <td style={styles.td}>{row.observation || "-"}</td>
              <td style={styles.tdActions}>
                <button style={styles.editButton} onClick={() => editExpense(row)}>
                  Editar
                </button>
                <button style={styles.deleteButton} onClick={() => deleteExpense(row.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          )}
        />

        <HistorySection
          title="Historial de químicos y fertilizantes"
          empty="No hay químicos/fertilizantes registrados en este mes."
          columns={["Fecha", "Tipo", "Producto", "Monto", "Observación", "Acciones"]}
          rows={chemicalRows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={styles.td}>{dateOnly(row.expense_date)}</td>
              <td style={styles.td}>{row.type || "-"}</td>
              <td style={styles.td}>{row.product || "-"}</td>
              <td style={styles.td}>{money(row.amount)}</td>
              <td style={styles.td}>{row.observation || "-"}</td>
              <td style={styles.tdActions}>
                <button style={styles.editButton} onClick={() => editChemical(row)}>
                  Editar
                </button>
                <button style={styles.deleteButton} onClick={() => deleteChemical(row.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}

function HistorySection({ title, empty, columns, rows, renderRow }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <p style={styles.sectionText}>{empty}</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} style={styles.th}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.map((row) => renderRow(row))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 28,
    background:
      "radial-gradient(circle at top left, rgba(184,137,53,0.18), transparent 32%), #f6f1e8",
    color: "#181818"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 24
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: 12,
    letterSpacing: 2,
    color: "#9a6a24",
    fontWeight: 800
  },
  title: {
    margin: 0,
    fontSize: 38,
    letterSpacing: "-1px"
  },
  subtitle: {
    maxWidth: 720,
    marginTop: 10,
    marginBottom: 0,
    fontSize: 16,
    color: "#5f5b53",
    lineHeight: 1.55
  },
  periodCard: {
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(184,137,53,0.22)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 16px 40px rgba(42,31,15,0.08)",
    backdropFilter: "blur(12px)"
  },
  periodControls: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 10,
    marginTop: 10
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 16
  },
  kpiCard: {
    background: "linear-gradient(180deg, #ffffff, #fbf8f1)",
    border: "1px solid #e7dcc8",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 14px 30px rgba(42,31,15,0.07)"
  },
  kpiLabel: {
    display: "block",
    fontSize: 12,
    color: "#7a746b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: 800,
    marginBottom: 8
  },
  kpiValue: {
    display: "block",
    fontSize: 25,
    letterSpacing: "-0.5px"
  },
  kpiHint: {
    display: "block",
    color: "#776f65",
    marginTop: 8
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "0.85fr 1.15fr",
    gap: 16,
    marginBottom: 16
  },
  historyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 16
  },
  card: {
    background: "rgba(255,255,255,0.86)",
    border: "1px solid #e7dcc8",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 38px rgba(42,31,15,0.08)",
    marginBottom: 16
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    marginBottom: 18
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22
  },
  sectionText: {
    margin: "7px 0 0",
    color: "#6d675f",
    lineHeight: 1.5
  },
  expenseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12
  },
  expenseGridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#5e574d",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #d7cbb6",
    background: "#fff",
    outline: "none",
    fontSize: 15
  },
  inputSmall: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid #d7cbb6",
    background: "#fff",
    outline: "none",
    fontSize: 14
  },
  darkButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#111111",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0,0,0,0.14)"
  },
  goldButton: {
    border: "none",
    borderRadius: 14,
    padding: "13px 18px",
    background: "linear-gradient(135deg, #b88935, #e0bd73)",
    color: "#1b1307",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(184,137,53,0.22)"
  },
  lightButton: {
    border: "1px solid #d7cbb6",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#fff",
    color: "#1b1307",
    fontWeight: 900,
    cursor: "pointer"
  },
  editButton: {
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#111111",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },
  deleteButton: {
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#DC2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },
  actionsRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 16
  },
  miniStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    minWidth: 260
  },
  loading: {
    color: "#6d675f"
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid #e4d8c4"
  },
  th: {
    background: "#181818",
    color: "#fff",
    padding: "13px 12px",
    fontSize: 12,
    textAlign: "left",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "13px 12px",
    borderTop: "1px solid #eadfcd",
    background: "#fff",
    whiteSpace: "nowrap"
  },
  tdActions: {
    padding: "13px 12px",
    borderTop: "1px solid #eadfcd",
    background: "#fff",
    whiteSpace: "nowrap",
    display: "flex",
    gap: 8
  }
};
