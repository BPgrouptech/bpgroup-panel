import { useEffect, useMemo, useState } from "react";

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

  const [farms, setFarms] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [payroll, setPayroll] = useState("");
  const [loading, setLoading] = useState(false);

  const [expenses, setExpenses] = useState({
    chemicals: "",
    pesticides: "",
    fertilizers: "",
    irrigation: "",
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

  async function loadFarms() {
    const data = await api("/farms");
    setFarms(data);
    if (data.length > 0 && !selectedFarmId) {
      setSelectedFarmId(data[0].id);
    }
  }

  async function loadSummary() {
    setLoading(true);
    try {
      const data = await api(`/farms-finance/monthly-summary?year=${year}&month=${month}`);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }

  async function savePayroll() {
    await api("/monthly-payroll", {
      method: "POST",
      body: JSON.stringify({
        payroll_year: year,
        payroll_month: month,
        total_payroll: payroll || 0
      })
    });

    alert("Nómina guardada correctamente");
    loadSummary();
  }

  async function saveExpenses() {
    if (!selectedFarmId) {
      alert("Selecciona una huerta");
      return;
    }

    await api(`/farms/${selectedFarmId}/monthly-expenses`, {
      method: "POST",
      body: JSON.stringify({
        expense_year: year,
        expense_month: month,
        ...expenses
      })
    });

    alert("Gastos guardados correctamente");

    setExpenses({
      chemicals: "",
      pesticides: "",
      fertilizers: "",
      irrigation: "",
      fuel: "",
      maintenance: "",
      other_expenses: "",
      observation: ""
    });

    loadSummary();
  }

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, item) => {
        acc.boxes += Number(item.boxes || 0);
        acc.income += Number(item.income || 0);
        acc.direct_expenses += Number(item.direct_expenses || 0);
        acc.assigned_payroll += Number(item.assigned_payroll || 0);
        acc.total_expenses += Number(item.total_expenses || 0);
        acc.profit += Number(item.profit || 0);
        return acc;
      },
      {
        boxes: 0,
        income: 0,
        direct_expenses: 0,
        assigned_payroll: 0,
        total_expenses: 0,
        profit: 0
      }
    );
  }, [summary]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Finanzas de Huertas</h1>
      <p>Resumen mensual de ingresos, gastos, nómina asignada y utilidad por huerta.</p>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div><b>Cajas</b><br />{totals.boxes.toLocaleString("es-MX")}</div>
        <div><b>Ingresos</b><br />{money(totals.income)}</div>
        <div><b>Gastos</b><br />{money(totals.total_expenses)}</div>
        <div><b>Utilidad</b><br />{money(totals.profit)}</div>
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

      <h2>Gastos mensuales por huerta</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <select value={selectedFarmId} onChange={(e) => setSelectedFarmId(e.target.value)}>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.code} - {farm.name}
            </option>
          ))}
        </select>

        <input placeholder="Químicos" type="number" value={expenses.chemicals} onChange={(e) => setExpenses({ ...expenses, chemicals: e.target.value })} />
        <input placeholder="Pesticidas" type="number" value={expenses.pesticides} onChange={(e) => setExpenses({ ...expenses, pesticides: e.target.value })} />
        <input placeholder="Fertilizantes" type="number" value={expenses.fertilizers} onChange={(e) => setExpenses({ ...expenses, fertilizers: e.target.value })} />
        <input placeholder="Riego" type="number" value={expenses.irrigation} onChange={(e) => setExpenses({ ...expenses, irrigation: e.target.value })} />
        <input placeholder="Combustible" type="number" value={expenses.fuel} onChange={(e) => setExpenses({ ...expenses, fuel: e.target.value })} />
        <input placeholder="Mantenimiento" type="number" value={expenses.maintenance} onChange={(e) => setExpenses({ ...expenses, maintenance: e.target.value })} />
        <input placeholder="Otros gastos" type="number" value={expenses.other_expenses} onChange={(e) => setExpenses({ ...expenses, other_expenses: e.target.value })} />

        <input
          placeholder="Observación"
          value={expenses.observation}
          onChange={(e) => setExpenses({ ...expenses, observation: e.target.value })}
        />

        <button onClick={saveExpenses}>Guardar gastos</button>
      </div>

      <hr />

      <h2>Resumen mensual</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Huerta</th>
                <th>Cajas</th>
                <th>Ingreso</th>
                <th>Gastos directos</th>
                <th>Nómina asignada</th>
                <th>Gasto total</th>
                <th>Utilidad</th>
              </tr>
            </thead>

            <tbody>
              {summary.map((item) => (
                <tr key={item.farm_id}>
                  <td>{item.farm_code} - {item.farm_name}</td>
                  <td>{Number(item.boxes || 0).toLocaleString("es-MX")}</td>
                  <td>{money(item.income)}</td>
                  <td>{money(item.direct_expenses)}</td>
                  <td>{money(item.assigned_payroll)}</td>
                  <td>{money(item.total_expenses)}</td>
                  <td>{money(item.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}