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
  const [savingSpecial, setSavingSpecial] = useState(false);

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
    special_expenses: 0,
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
    product: "",
    amount: "",
    observation: ""
  });
  const [chemInvoice, setChemInvoice] = useState(null);

  const [editingChemicalId, setEditingChemicalId] = useState(null);
  const [chemicalRows, setChemicalRows] = useState([]);

  const [specialForm, setSpecialForm] = useState({
    expense_date: todayString(),
    description: "",
    total_amount: "",
    mode: "UNICO",
    start_year: now.getFullYear(),
    start_month: now.getMonth() + 1,
    end_year: now.getFullYear(),
    end_month: now.getMonth() + 1,
    observation: ""
  });
  const [specialInvoice, setSpecialInvoice] = useState(null);
  const [editingSpecialId, setEditingSpecialId] = useState(null);
  const [specialRows, setSpecialRows] = useState([]);

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
      const [payrollData, expensesData, chemicalsData, specialsData] = await Promise.all([
        api(`/weekly-payroll?year=${year}&month=${month}`),
        api(`/weekly-expenses?year=${year}&month=${month}`),
        api(`/chemicals?year=${year}&month=${month}`),
        api(`/special-expenses?year=${year}&month=${month}`)
      ]);

      setPayrollRows(payrollData || []);
      setExpenseRows(expensesData || []);
      setChemicalRows(chemicalsData || []);
      setSpecialRows(specialsData || []);
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
      product: "",
      amount: "",
      observation: ""
    });
    setChemInvoice(null);
    setEditingChemicalId(null);
  }

  function resetSpecialForm() {
    setSpecialForm({
      expense_date: todayString(),
      description: "",
      total_amount: "",
      mode: "UNICO",
      start_year: Number(year),
      start_month: Number(month),
      end_year: Number(year),
      end_month: Number(month),
      observation: ""
    });
    setSpecialInvoice(null);
    setEditingSpecialId(null);
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

      setSavingChemical(true);

      const path = editingChemicalId
        ? `/chemicals/${editingChemicalId}`
        : "/chemicals";

      const method = editingChemicalId ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("expense_date", chemicalForm.expense_date);
      formData.append("product", chemicalForm.product || "");
      formData.append("amount", chemicalForm.amount || 0);
      formData.append("observation", chemicalForm.observation || "");

      if (chemInvoice) {
        formData.append("invoice", chemInvoice);
      }

      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando químico/fertilizante");
      }

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

  async function saveSpecialExpense() {
    try {
      if (!specialForm.expense_date) {
        alert("Selecciona la fecha del gasto");
        return;
      }

      if (!specialForm.description.trim()) {
        alert("Ingresa una descripción");
        return;
      }

      if (specialForm.mode === "DIFERIDO") {
        const startKey = Number(specialForm.start_year) * 12 + Number(specialForm.start_month);
        const endKey = Number(specialForm.end_year) * 12 + Number(specialForm.end_month);

        if (endKey < startKey) {
          alert("El mes final no puede ser anterior al mes inicial");
          return;
        }
      }

      setSavingSpecial(true);

      const path = editingSpecialId
        ? `/special-expenses/${editingSpecialId}`
        : "/special-expenses";

      const method = editingSpecialId ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("expense_date", specialForm.expense_date);
      formData.append("description", specialForm.description || "");
      formData.append("total_amount", specialForm.total_amount || 0);
      formData.append("mode", specialForm.mode || "UNICO");
      formData.append("observation", specialForm.observation || "");

      if (specialForm.mode === "DIFERIDO") {
        formData.append("start_year", specialForm.start_year);
        formData.append("start_month", specialForm.start_month);
        formData.append("end_year", specialForm.end_year);
        formData.append("end_month", specialForm.end_month);
      }

      if (specialInvoice) {
        formData.append("invoice", specialInvoice);
      }

      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando gasto especial");
      }

      alert(editingSpecialId ? "Gasto especial actualizado" : "Gasto especial guardado");
      resetSpecialForm();
      await reloadAll();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando gasto especial");
    } finally {
      setSavingSpecial(false);
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
      product: row.product || "",
      amount: row.amount || "",
      observation: row.observation || ""
    });
    setChemInvoice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editSpecialExpense(row) {
    setEditingSpecialId(row.id);
    setSpecialForm({
      expense_date: dateOnly(row.expense_date),
      description: row.description || "",
      total_amount: row.total_amount || "",
      mode: row.mode || "UNICO",
      start_year: row.start_year || Number(year),
      start_month: row.start_month || Number(month),
      end_year: row.end_year || Number(year),
      end_month: row.end_month || Number(month),
      observation: row.observation || ""
    });
    setSpecialInvoice(null);
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

  async function deleteSpecialExpense(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar este gasto especial?");
    if (!ok) return;

    try {
      await api(`/special-expenses/${id}`, { method: "DELETE" });
      if (editingSpecialId === id) resetSpecialForm();
      await reloadAll();
    } catch (err) {
      alert(err.message || "Error eliminando gasto especial");
    }
  }

  async function openInvoice(fileUrl, fileName = "factura") {
    try {
      if (!fileUrl) return;

      const res = await fetch(`${API_URL}/files/${fileUrl}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        alert("No se pudo abrir la factura");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = fileName || "factura";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error(err);
      alert("Error abriendo factura");
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

  function specialMonthlyAmount(row) {
    if (row.mode !== "DIFERIDO") return Number(row.total_amount || 0);

    const months =
      (Number(row.end_year) * 12 + Number(row.end_month)) -
      (Number(row.start_year) * 12 + Number(row.start_month)) +
      1;

    if (!months || months <= 0) return 0;
    return Number(row.total_amount || 0) / months;
  }

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
          <small style={styles.kpiHint}>Gastos semanales + químicos + especiales + personal</small>
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

          <div style={styles.field}>
            <label style={styles.label}>Factura / foto</label>
            <input
              style={styles.input}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setChemInvoice(e.target.files?.[0] || null)}
            />
            {editingChemicalId && (
              <small style={styles.kpiHint}>
                Si no seleccionas una nueva factura, se mantiene la anterior.
              </small>
            )}
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
            <h2 style={styles.sectionTitle}>
              {editingSpecialId ? "Editar gasto especial" : "Gasto especial / diferido"}
            </h2>
            <p style={styles.sectionText}>
              Registra compras grandes, materiales o gastos únicos. Si el gasto dura varios meses,
              márcalo como diferido y el resumen mensual dividirá el monto automáticamente.
            </p>
          </div>
        </div>

        <div style={styles.expenseGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Fecha de compra</label>
            <input
              style={styles.input}
              type="date"
              value={specialForm.expense_date}
              onChange={(e) =>
                setSpecialForm({ ...specialForm, expense_date: e.target.value })
              }
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Modo</label>
            <select
              style={styles.input}
              value={specialForm.mode}
              onChange={(e) =>
                setSpecialForm({ ...specialForm, mode: e.target.value })
              }
            >
              <option value="UNICO">Gasto único</option>
              <option value="DIFERIDO">Diferido entre meses</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Monto total</label>
            <input
              style={styles.input}
              type="number"
              value={specialForm.total_amount}
              onChange={(e) =>
                setSpecialForm({ ...specialForm, total_amount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div style={{ ...styles.field, gridColumn: "span 2" }}>
            <label style={styles.label}>Descripción</label>
            <input
              style={styles.input}
              value={specialForm.description}
              onChange={(e) =>
                setSpecialForm({ ...specialForm, description: e.target.value.toUpperCase() })
              }
              placeholder="Ej: MATERIAL AL POR MAYOR"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Factura / foto</label>
            <input
              style={styles.input}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setSpecialInvoice(e.target.files?.[0] || null)}
            />
            {editingSpecialId && (
              <small style={styles.kpiHint}>
                Si no seleccionas una nueva factura, se mantiene la anterior.
              </small>
            )}
          </div>

          {specialForm.mode === "DIFERIDO" && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Desde año</label>
                <input
                  style={styles.input}
                  type="number"
                  value={specialForm.start_year}
                  onChange={(e) =>
                    setSpecialForm({ ...specialForm, start_year: e.target.value })
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Desde mes</label>
                <select
                  style={styles.input}
                  value={specialForm.start_month}
                  onChange={(e) =>
                    setSpecialForm({ ...specialForm, start_month: e.target.value })
                  }
                >
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Hasta año</label>
                <input
                  style={styles.input}
                  type="number"
                  value={specialForm.end_year}
                  onChange={(e) =>
                    setSpecialForm({ ...specialForm, end_year: e.target.value })
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Hasta mes</label>
                <select
                  style={styles.input}
                  value={specialForm.end_month}
                  onChange={(e) =>
                    setSpecialForm({ ...specialForm, end_month: e.target.value })
                  }
                >
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Observación</label>
            <input
              style={styles.input}
              value={specialForm.observation}
              onChange={(e) =>
                setSpecialForm({ ...specialForm, observation: e.target.value.toUpperCase() })
              }
              placeholder="Detalle opcional"
            />
          </div>
        </div>

        <div style={styles.actionsRight}>
          {editingSpecialId && (
            <button style={styles.lightButton} onClick={resetSpecialForm}>
              Cancelar edición
            </button>
          )}
          <button
            style={styles.goldButton}
            onClick={saveSpecialExpense}
            disabled={savingSpecial}
          >
            {savingSpecial
              ? "Guardando..."
              : editingSpecialId
                ? "Actualizar gasto especial"
                : "Guardar gasto especial"}
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
                  <th style={styles.th}>Especiales</th>
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
                  <td style={styles.td}>{money(summary.special_expenses)}</td>
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
          columns={["Fecha", "Producto", "Monto", "Observación", "Factura", "Acciones"]}
          rows={chemicalRows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={styles.td}>{dateOnly(row.expense_date)}</td>
              <td style={styles.td}>{row.product || "-"}</td>
              <td style={styles.td}>{money(row.amount)}</td>
              <td style={styles.td}>{row.observation || "-"}</td>
              <td style={styles.td}>
                {row.invoice_file_url ? (
                  <button
                    style={styles.editButton}
                    onClick={() => openInvoice(row.invoice_file_url, row.invoice_file_name)}
                  >
                    Ver factura
                  </button>
                ) : (
                  "-"
                )}
              </td>
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

        <HistorySection
          title="Historial de gastos especiales"
          empty="No hay gastos especiales aplicables a este mes."
          columns={["Fecha", "Modo", "Descripción", "Monto total", "Aplicado este mes", "Rango", "Factura", "Acciones"]}
          rows={specialRows}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={styles.td}>{dateOnly(row.expense_date)}</td>
              <td style={styles.td}>{row.mode === "DIFERIDO" ? "Diferido" : "Único"}</td>
              <td style={styles.td}>{row.description || "-"}</td>
              <td style={styles.td}>{money(row.total_amount)}</td>
              <td style={styles.td}>{money(specialMonthlyAmount(row))}</td>
              <td style={styles.td}>
                {row.mode === "DIFERIDO"
                  ? `${MONTHS[Number(row.start_month) - 1]} ${row.start_year} → ${MONTHS[Number(row.end_month) - 1]} ${row.end_year}`
                  : "-"}
              </td>
              <td style={styles.td}>
                {row.invoice_file_url ? (
                  <button
                    style={styles.editButton}
                    onClick={() => openInvoice(row.invoice_file_url, row.invoice_file_name)}
                  >
                    Ver factura
                  </button>
                ) : (
                  "-"
                )}
              </td>
              <td style={styles.tdActions}>
                <button style={styles.editButton} onClick={() => editSpecialExpense(row)}>
                  Editar
                </button>
                <button style={styles.deleteButton} onClick={() => deleteSpecialExpense(row.id)}>
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
