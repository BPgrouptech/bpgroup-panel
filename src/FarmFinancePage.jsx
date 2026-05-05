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

  const [payrollDate, setPayrollDate] = useState(todayString());
  const [payroll, setPayroll] = useState("");
  const [payrollObservation, setPayrollObservation] = useState("");

  const [expenseDate, setExpenseDate] = useState(todayString());
  const [expenses, setExpenses] = useState({
    electricity: "",
    fuel: "",
    maintenance: "",
    other_expenses: "",
    observation: ""
  });

  const [chemicalForm, setChemicalForm] = useState({
    expense_date: todayString(),
    type: "QUIMICO",
    product: "",
    amount: "",
    observation: ""
  });

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
      const data = await api(
        `/farms-finance/monthly-summary?year=${year}&month=${month}`
      );

      setSummary(data || {});
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cargando resumen");
    } finally {
      setLoading(false);
    }
  }

  async function savePayroll() {
    try {
      if (!payrollDate) {
        alert("Selecciona la fecha de la semana");
        return;
      }

      setSavingPayroll(true);

      await api("/weekly-payroll", {
        method: "POST",
        body: JSON.stringify({
          week_date: payrollDate,
          total_payroll: payroll || 0,
          observation: payrollObservation || null
        })
      });

      alert("Pago semanal guardado correctamente");
      setPayroll("");
      setPayrollObservation("");
      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando pago semanal");
    } finally {
      setSavingPayroll(false);
    }
  }

  async function saveExpenses() {
    try {
      if (!expenseDate) {
        alert("Selecciona la fecha de la semana");
        return;
      }

      setSavingExpenses(true);

      await api("/weekly-expenses", {
        method: "POST",
        body: JSON.stringify({
          week_date: expenseDate,
          electricity: expenses.electricity || 0,
          fuel: expenses.fuel || 0,
          maintenance: expenses.maintenance || 0,
          other_expenses: expenses.other_expenses || 0,
          observation: expenses.observation || null
        })
      });

      alert("Gastos semanales guardados correctamente");
      setExpenses({
        electricity: "",
        fuel: "",
        maintenance: "",
        other_expenses: "",
        observation: ""
      });
      loadSummary();
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
        alert("Selecciona la fecha del químico o fertilizante");
        return;
      }

      if (!chemicalForm.type) {
        alert("Selecciona si es químico o fertilizante");
        return;
      }

      setSavingChemical(true);

      await api("/chemicals", {
        method: "POST",
        body: JSON.stringify({
          expense_date: chemicalForm.expense_date,
          type: chemicalForm.type,
          product: chemicalForm.product || null,
          amount: chemicalForm.amount || 0,
          observation: chemicalForm.observation || null
        })
      });

      alert("Químico / fertilizante guardado correctamente");
      setChemicalForm({
        expense_date: todayString(),
        type: "QUIMICO",
        product: "",
        amount: "",
        observation: ""
      });
      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando químico / fertilizante");
    } finally {
      setSavingChemical(false);
    }
  }

  useEffect(() => {
    loadSummary();
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
            Control mensual global calculado desde registros semanales de gastos,
            pago de personal y químicos/fertilizantes por fecha.
          </p>
        </div>

        <div style={styles.periodCard}>
          <label style={styles.label}>Periodo del resumen mensual</label>

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

            <button style={styles.darkButton} onClick={loadSummary}>
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
          <small style={styles.kpiHint}>Semanas + químicos + personal</small>
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
              <h2 style={styles.sectionTitle}>Pago de personal semanal</h2>
              <p style={styles.sectionText}>
                Registra el pago por semana. El resumen mensual suma todas las semanas
                que caen dentro del mes seleccionado.
              </p>
            </div>
          </div>

          <div style={styles.formStack}>
            <div style={styles.field}>
              <label style={styles.label}>Fecha de la semana</label>
              <input
                style={styles.input}
                type="date"
                value={payrollDate}
                onChange={(e) => setPayrollDate(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Pago total del personal</label>
              <input
                style={styles.input}
                type="number"
                value={payroll}
                onChange={(e) => setPayroll(e.target.value)}
                placeholder="Ej: 250000"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Observación</label>
              <input
                style={styles.input}
                value={payrollObservation}
                onChange={(e) => setPayrollObservation(e.target.value)}
                placeholder="Detalle opcional"
              />
            </div>

            <button
              style={styles.goldButton}
              onClick={savePayroll}
              disabled={savingPayroll}
            >
              {savingPayroll ? "Guardando..." : "Guardar pago semanal"}
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Gastos semanales globales</h2>
              <p style={styles.sectionText}>
                Estos gastos aplican al total de todas las huertas. El sistema los
                suma por mes automáticamente.
              </p>
            </div>
          </div>

          <div style={styles.expenseGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Fecha de la semana</label>
              <input
                style={styles.input}
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Luz</label>
              <input
                style={styles.input}
                type="number"
                value={expenses.electricity}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    electricity: e.target.value
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Combustible</label>
              <input
                style={styles.input}
                type="number"
                value={expenses.fuel}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    fuel: e.target.value
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mantenimiento</label>
              <input
                style={styles.input}
                type="number"
                value={expenses.maintenance}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    maintenance: e.target.value
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Otros gastos</label>
              <input
                style={styles.input}
                type="number"
                value={expenses.other_expenses}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    other_expenses: e.target.value
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Observación</label>
              <input
                style={styles.input}
                value={expenses.observation}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    observation: e.target.value
                  })
                }
                placeholder="Detalle opcional"
              />
            </div>
          </div>

          <div style={styles.actionsRight}>
            <button
              style={styles.darkButton}
              onClick={saveExpenses}
              disabled={savingExpenses}
            >
              {savingExpenses ? "Guardando..." : "Guardar gastos semanales"}
            </button>
          </div>
        </section>
      </div>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Químicos y fertilizantes</h2>
            <p style={styles.sectionText}>
              Registra cada químico o fertilizante por fecha. El resumen mensual los
              suma según el mes seleccionado.
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
                setChemicalForm({ ...chemicalForm, product: e.target.value })
              }
              placeholder="Ej: Urea, fungicida, fertilizante..."
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

          <div style={styles.field}>
            <label style={styles.label}>Observación</label>
            <input
              style={styles.input}
              value={chemicalForm.observation}
              onChange={(e) =>
                setChemicalForm({ ...chemicalForm, observation: e.target.value })
              }
              placeholder="Detalle opcional"
            />
          </div>
        </div>

        <div style={styles.actionsRight}>
          <button
            style={styles.goldButton}
            onClick={saveChemical}
            disabled={savingChemical}
          >
            {savingChemical ? "Guardando..." : "Guardar químico / fertilizante"}
          </button>
        </div>
      </section>

      <section style={{ ...styles.card, marginTop: 16 }}>
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
    </div>
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
  card: {
    background: "rgba(255,255,255,0.86)",
    border: "1px solid #e7dcc8",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 38px rgba(42,31,15,0.08)"
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
  formStack: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12
  },
  expenseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
  actionsRight: {
    display: "flex",
    justifyContent: "flex-end",
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
  }
};
