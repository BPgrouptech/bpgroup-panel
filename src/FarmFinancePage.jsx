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

export default function FarmFinancePage() {
  const token = localStorage.getItem("token");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [savingPayroll, setSavingPayroll] = useState(false);
  const [savingExpenses, setSavingExpenses] = useState(false);

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

  const [payroll, setPayroll] = useState("");

  const [expenses, setExpenses] = useState({
    chemicals_fertilizers: "",
    electricity: "",
    fuel: "",
    maintenance: "",
    other_expenses: "",
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

      const nextSummary = data || {};
      setSummary(nextSummary);

      setPayroll(nextSummary.total_payroll || "");

      setExpenses({
        chemicals_fertilizers: nextSummary.chemicals_fertilizers || "",
        electricity: nextSummary.electricity || "",
        fuel: nextSummary.fuel || "",
        maintenance: nextSummary.maintenance || "",
        other_expenses: nextSummary.other_expenses || "",
        observation: nextSummary.observation || ""
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cargando resumen");
    } finally {
      setLoading(false);
    }
  }

  async function savePayroll() {
    try {
      setSavingPayroll(true);

      await api("/monthly-payroll", {
        method: "POST",
        body: JSON.stringify({
          payroll_year: year,
          payroll_month: month,
          total_payroll: payroll || 0
        })
      });

      alert("Pago de personal guardado / actualizado correctamente");
      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando pago de personal");
    } finally {
      setSavingPayroll(false);
    }
  }

  async function saveExpenses() {
    try {
      setSavingExpenses(true);

      await api("/global-monthly-expenses", {
        method: "POST",
        body: JSON.stringify({
          expense_year: year,
          expense_month: month,
          ...expenses
        })
      });

      alert("Gastos guardados / actualizados correctamente");
      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando gastos");
    } finally {
      setSavingExpenses(false);
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
            Control mensual global de ingresos, gastos, pago de personal y utilidad
            de todas las huertas productoras.
          </p>
        </div>

        <div style={styles.periodCard}>
          <label style={styles.label}>Periodo</label>

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
          <small style={styles.kpiHint}>
            Incluye gastos + pago de personal
          </small>
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
              <h2 style={styles.sectionTitle}>Pago de personal mensual</h2>
              <p style={styles.sectionText}>
                Este valor no se calcula automático. Lo ingresas tú cada mes y se
                resta completo del ingreso global.
              </p>
            </div>
          </div>

          <div style={styles.formRow}>
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

            <button
              style={styles.goldButton}
              onClick={savePayroll}
              disabled={savingPayroll}
            >
              {savingPayroll ? "Guardando..." : "Guardar personal"}
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Gastos mensuales globales</h2>
              <p style={styles.sectionText}>
                Estos gastos aplican al total de todas las huertas, no a una huerta
                individual.
              </p>
            </div>
          </div>

          <div style={styles.expenseGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Químicos y fertilizantes</label>
              <input
                style={styles.input}
                type="number"
                value={expenses.chemicals_fertilizers}
                onChange={(e) =>
                  setExpenses({
                    ...expenses,
                    chemicals_fertilizers: e.target.value
                  })
                }
                placeholder="0.00"
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
              {savingExpenses ? "Guardando..." : "Guardar gastos"}
            </button>
          </div>
        </section>
      </div>

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
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "end"
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