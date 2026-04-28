import { useEffect, useState } from "react";

const API_URL = "https://bpgroup-api-production.up.railway.app";

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

export default function FarmFinancePage() {
  const token = localStorage.getItem("token");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

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
  const [loading, setLoading] = useState(false);

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
      await api("/monthly-payroll", {
        method: "POST",
        body: JSON.stringify({
          payroll_year: year,
          payroll_month: month,
          total_payroll: payroll || 0
        })
      });

      alert("Nómina guardada correctamente");
      setPayroll("");
      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando nómina");
    }
  }

  async function saveExpenses() {
    try {
      await api("/global-monthly-expenses", {
        method: "POST",
        body: JSON.stringify({
          expense_year: year,
          expense_month: month,
          ...expenses
        })
      });

      alert("Gastos globales guardados correctamente");

      setExpenses({
        chemicals_fertilizers: "",
        electricity: "",
        fuel: "",
        maintenance: "",
        other_expenses: "",
        observation: ""
      });

      loadSummary();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando gastos");
    }
  }

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Finanzas de Huertas</h1>
      <p>
        Resumen mensual global de todas las huertas: ingresos, gastos, nómina y
        utilidad.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Año"
        />

        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="1">Enero</option>
          <option value="2">Febrero</option>
          <option value="3">Marzo</option>
          <option value="4">Abril</option>
          <option value="5">Mayo</option>
          <option value="6">Junio</option>
          <option value="7">Julio</option>
          <option value="8">Agosto</option>
          <option value="9">Septiembre</option>
          <option value="10">Octubre</option>
          <option value="11">Noviembre</option>
          <option value="12">Diciembre</option>
        </select>

        <button onClick={loadSummary}>Actualizar</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <b>Cajas</b>
          <br />
          {Number(summary.total_boxes || 0).toLocaleString("es-MX")}
        </div>

        <div>
          <b>Ingresos</b>
          <br />
          {money(summary.total_income)}
        </div>

        <div>
          <b>Gastos</b>
          <br />
          {money(summary.total_expenses)}
        </div>

        <div>
          <b>Utilidad</b>
          <br />
          {money(summary.profit)}
        </div>
      </div>

      <hr />

      <h2>Nómina mensual total</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          type="number"
          value={payroll}
          onChange={(e) => setPayroll(e.target.value)}
          placeholder="Ej: 250000"
        />

        <button onClick={savePayroll}>Guardar nómina</button>
      </div>

      <hr />

      <h2>Gastos mensuales globales</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24
        }}
      >
        <input
          placeholder="Químicos y fertilizantes"
          type="number"
          value={expenses.chemicals_fertilizers}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              chemicals_fertilizers: e.target.value
            })
          }
        />

        <input
          placeholder="Luz"
          type="number"
          value={expenses.electricity}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              electricity: e.target.value
            })
          }
        />

        <input
          placeholder="Combustible"
          type="number"
          value={expenses.fuel}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              fuel: e.target.value
            })
          }
        />

        <input
          placeholder="Mantenimiento"
          type="number"
          value={expenses.maintenance}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              maintenance: e.target.value
            })
          }
        />

        <input
          placeholder="Otros gastos"
          type="number"
          value={expenses.other_expenses}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              other_expenses: e.target.value
            })
          }
        />

        <input
          placeholder="Observación"
          value={expenses.observation}
          onChange={(e) =>
            setExpenses({
              ...expenses,
              observation: e.target.value
            })
          }
        />

        <button onClick={saveExpenses}>Guardar gastos</button>
      </div>

      <hr />

      <h2>Resumen mensual global</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="8"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>Cortes</th>
                <th>Cajas</th>
                <th>Ingreso</th>
                <th>Químicos y fertilizantes</th>
                <th>Luz</th>
                <th>Combustible</th>
                <th>Mantenimiento</th>
                <th>Otros</th>
                <th>Nómina</th>
                <th>Gasto total</th>
                <th>Utilidad</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{Number(summary.total_cuts || 0)}</td>
                <td>
                  {Number(summary.total_boxes || 0).toLocaleString("es-MX")}
                </td>
                <td>{money(summary.total_income)}</td>
                <td>{money(summary.chemicals_fertilizers)}</td>
                <td>{money(summary.electricity)}</td>
                <td>{money(summary.fuel)}</td>
                <td>{money(summary.maintenance)}</td>
                <td>{money(summary.other_expenses)}</td>
                <td>{money(summary.total_payroll)}</td>
                <td>{money(summary.total_expenses)}</td>
                <td>{money(summary.profit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}