import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import FarmFinancePage from "./FarmFinancePage";
import AirplanesPage from "./AirplanesPage";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import bpLogo from "./assets/bp-logo.png";
import "./responsive.css";
const API_URL = "https://bpgroup-api-production.up.railway.app";

const TYPE_OPTIONS = [
  { label: "LIGERO", value: "LIGERO", abbr: "LIG" },
  { label: "PESADO", value: "PESADO", abbr: "PES" },
  { label: "MOTO", value: "MOTO", abbr: "MOT" },
  { label: "ATV/UTV", value: "ATV/UTV", abbr: "ATV" },
  { label: "ACCESORIO", value: "ACCESORIO", abbr: "ACC" },
  { label: "OTROS", value: "OTROS", abbr: "OTT" }
];

const FUNCTION_OPTIONS = [
  { label: "AGRICOLA", value: "AGRICOLA", abbr: "AGR" },
  { label: "CONSTRUCCION", value: "CONSTRUCCION", abbr: "CON" },
  { label: "TRANSPORTE", value: "TRANSPORTE", abbr: "TRA" },
  { label: "UTILITARIO", value: "UTILITARIO", abbr: "UTI" },
  { label: "OTROS", value: "OTROS", abbr: "OTR" }
];

const emptyAssetForm = {
  type: "",
  function: "",
  code_number: "",
  brand: "",
  model: "",
  year: "",
  responsible: "",
  observation: "",
  numero_asignado: ""
};

const emptyFarmForm = {
  code: "",
  name: "",
  estado: "",
  region: "",
  sector: "",
  coordenadas: "",
  maps_link: "",
  hectareas: "",
  numero_terrenos: "",
  tipo_suelos: "",
  variedad_banano: "",
  edad_plantacion: "",
  sistema_riego: "",
  fuente_agua: "",
  bomba_agua: "",
  prop_medidor_elec: "",
  empacadora: "",
  a_favor_de: "",
  produccion_est_mensual: "",
  produccion_est_anual: "",
  encargado: "",
  telefono_encargado: "",
  empresa_compradora: ""
};


const emptyCutForm = {
  cut_date: "",
  color: "",
  boxes_produced: "",
  price_per_box: "",
  buyer_company: "",
  box_design: "",
  observation: ""
};

const CUT_COLORS = [
  "ROJO", "AZUL", "VERDE", "AMARILLO", "MORADO", "NARANJA",
  "BLANCO", "NEGRO", "ROSADO", "CAFÉ", "GRIS"
];

const MONTH_NAMES = {
  1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL",
  5: "MAYO", 6: "JUNIO", 7: "JULIO", 8: "AGOSTO",
  9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
};

const CHART_COLORS = [
  "#B88935", "#111111", "#E6C06D", "#64748B", "#16A34A",
  "#DC2626", "#0EA5E9", "#A855F7", "#F97316", "#14B8A6"
];
const STAFF_AREAS = [
  { label: "Todos los empleados", value: "TODOS" },
  { label: "Personal Huertas", value: "AGRICOLA" },
  { label: "Personal Constructora", value: "CONSTRUCTORA" },
  { label: "Personal Limpieza", value: "LIMPIEZA" },
  { label: "Personal Seguridad", value: "SEGURIDAD" },
  { label: "Otros", value: "OTROS" }
];

function App() {
  const [editingCutId, setEditingCutId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState(
  user?.role === "agricola" ? "huertas" : "dashboard"
  );

  const fetchStaff = async (area = "") => {
  try {
    setLoadingStaff(true);

    const url = area
      ? `${API_URL}/staff?area=${encodeURIComponent(area)}`
      : `${API_URL}/staff`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error cargando personal");
      return;
    }

    setStaff(data);
  } catch (err) {
    console.error(err);
    alert("Error conectando al servidor");
  } finally {
    setLoadingStaff(false);
  }


};


const openStaffArea = async (area) => {
  setSelectedStaffArea(area);
  setStaffView("list");

  if (area === "TODOS") {
    await fetchStaff("");
  } else {
    await fetchStaff(area);
  }
};

const handleStaffInputChange = (field, value) => {
  setStaffForm((prev) => ({
    ...prev,
    [field]: field === "curp" || field === "area" ? value.toUpperCase() : value.toUpperCase()
  }));
};

const resetStaffForm = () => {
  setStaffForm({
    full_name: "",
    curp: "",
    area: selectedStaffArea || "",
    company: "",
    birth_date: "",
    address: "",
    phone: "",
    emergency_contact_1_name: "",
    emergency_contact_1_phone: "",
    emergency_contact_2_name: "",
    emergency_contact_2_phone: ""
  });
  setEditingStaffId(null);
};

const openNewStaff = () => {
  if (selectedStaffArea === "TODOS") {
    alert("PARA CREAR UN EMPLEADO, ENTRA PRIMERO A UN ÁREA ESPECÍFICA.");
    return;
  }

  resetStaffForm();
  setStaffForm((prev) => ({ ...prev, area: selectedStaffArea || "" }));
  setStaffView("form");
};

const handleSaveStaff = async () => {
  try {
    if (!staffForm.full_name.trim() || !staffForm.area.trim()) {
      alert("NOMBRE Y ÁREA SON OBLIGATORIOS");
      return;
    }

    const payload = {
      full_name: staffForm.full_name.trim(),
      curp: staffForm.curp.trim() || null,
      area: staffForm.area.trim(),
      company: staffForm.company.trim() || null,
      birth_date: staffForm.birth_date || null,
      address: staffForm.address.trim() || null,
      phone: staffForm.phone.trim() || null,
      emergency_contact_1_name: staffForm.emergency_contact_1_name.trim() || null,
      emergency_contact_1_phone: staffForm.emergency_contact_1_phone.trim() || null,
      emergency_contact_2_name: staffForm.emergency_contact_2_name.trim() || null,
      emergency_contact_2_phone: staffForm.emergency_contact_2_phone.trim() || null
    };

    const url = editingStaffId
      ? `${API_URL}/staff/${editingStaffId}`
      : `${API_URL}/staff`;

    const method = editingStaffId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error guardando empleado");
      return;
    }

    const savedStaff = data.staff || data.employee || data;

if (!editingStaffId && (staffIneFiles.length > 0 || staffPdfFiles.length > 0)) {
  setSelectedStaff(savedStaff);

  const formData = new FormData();

  staffIneFiles.forEach((file) => {
    formData.append("ine", file);
  });

  staffPdfFiles.forEach((file) => {
    formData.append("pdfs", file);
  });

  const fileRes = await fetch(`${API_URL}/staff/${savedStaff.id}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const fileData = await fileRes.json();

  if (!fileRes.ok) {
    alert(fileData.error || "Empleado creado, pero falló la subida de archivos");
  }
}

    alert(editingStaffId ? "EMPLEADO ACTUALIZADO" : "EMPLEADO CREADO");
    setStaffView("list");
    resetStaffForm();
    await fetchStaff(selectedStaffArea);
  } catch (err) {
    console.error(err);
    alert("Error conectando al servidor");
  }
};

const openEditStaff = (employee) => {
  setEditingStaffId(employee.id);
  setStaffForm({
    full_name: employee.full_name || "",
    curp: employee.curp || "",
    area: employee.area || "",
    company: employee.company || "",
    birth_date: employee.birth_date ? String(employee.birth_date).slice(0, 10) : "",
    address: employee.address || "",
    phone: employee.phone || "",
    emergency_contact_1_name: employee.emergency_contact_1_name || "",
    emergency_contact_1_phone: employee.emergency_contact_1_phone || "",
    emergency_contact_2_name: employee.emergency_contact_2_name || "",
    emergency_contact_2_phone: employee.emergency_contact_2_phone || ""
  });
  setStaffView("form");
};

const handleDeleteStaff = async (id) => {
  const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE EMPLEADO?");
  if (!ok) return;

  const res = await fetch(`${API_URL}/staff/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error eliminando empleado");
    return;
  }

  alert("EMPLEADO ELIMINADO");
  await fetchStaff(selectedStaffArea);
};

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [detailAsset, setDetailAsset] = useState(null);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetFiles, setAssetFiles] = useState([]);
  const [assetPhotoFiles, setAssetPhotoFiles] = useState([]);
  const [assetPdfFiles, setAssetPdfFiles] = useState([]);
  const [uploadingAssetFiles, setUploadingAssetFiles] = useState(false);

  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [farmForm, setFarmForm] = useState(emptyFarmForm);
  const [savingFarm, setSavingFarm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmFiles, setFarmFiles] = useState([]);
  const [huertasView, setHuertasView] = useState("list");
  const [farmPdfFiles, setFarmPdfFiles] = useState([]);
  const [farmPhotoFiles, setFarmPhotoFiles] = useState([]);
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [addingFiles, setAddingFiles] = useState(false);
  const [cutForm, setCutForm] = useState(emptyCutForm);
  const [savingCut, setSavingCut] = useState(false);
  const [farmCuts, setFarmCuts] = useState([]);
  const [allFarmCuts, setAllFarmCuts] = useState([]);
  const [farmCutsSummary, setFarmCutsSummary] = useState([]);
  const [loadingCuts, setLoadingCuts] = useState(false);
  const [cutsFilter, setCutsFilter] = useState({ year: null, month: null });
  const [globalDashboard, setGlobalDashboard] = useState({
    totals: {
      total_cuts: 0,
      total_boxes: 0,
      total_income: 0,
      avg_price: 0
    },
    byMonth: [],
    byFarm: [],
    byColor: []
  });
  const [loadingGlobalDashboard, setLoadingGlobalDashboard] = useState(false);

  const [dashboardSummary, setDashboardSummary] = useState({
  totals: {},
  staffByArea: [],
  assetsByFunction: [],
  latestStaff: [],
  latestAssets: []
});
const [loadingDashboardSummary, setLoadingDashboardSummary] = useState(false);

  const isAdmin = user?.role === "admin";
  const isAgricola = user?.role === "agricola";
  const isFinanzas = user?.role === "finanzas";
  const isInventario = user?.role === "inventario";
  const isViewer = user?.role === "viewer";

  const canSeeMoney = isAdmin || isFinanzas;
  const canAddCuts = isAdmin || isAgricola;
  const canManageFarms = isAdmin;
  const canManageAssets = isAdmin || isInventario;

  const canSeeDashboard = isAdmin || isFinanzas || isAgricola;
  const canSeeAssets = isAdmin || isInventario;
  const canSeeHuertas = isAdmin || isAgricola || isFinanzas || isViewer;
  const canSeeStaff = isAdmin;

  const [graphCuts, setGraphCuts] = useState([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);

  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffView, setStaffView] = useState("areas");
  const [selectedStaffArea, setSelectedStaffArea] = useState("");
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    curp: "",
    area: "",
    company: "",
    birth_date: "",
    address: "",
    phone: "",
    emergency_contact_1_name: "",
    emergency_contact_1_phone: "",
    emergency_contact_2_name: "",
    emergency_contact_2_phone: ""
  });
const [editingStaffId, setEditingStaffId] = useState(null);
const [selectedStaff, setSelectedStaff] = useState(null);
const [staffFiles, setStaffFiles] = useState([]);
const [staffIneFiles, setStaffIneFiles] = useState([]);
const [staffPdfFiles, setStaffPdfFiles] = useState([]);
const [uploadingStaffFiles, setUploadingStaffFiles] = useState(false);
  useEffect(() => {
  if (user) {
    document.title = `Panel BP Group - ${user.email}`;
  } else {
    document.title = "Panel-BPgroup";
  }
}, [user]);
  
  useEffect(() => {
    if (token) {
      fetchMe(token);
    }
  }, []);

  useEffect(() => {
    if (token && currentView === "assets") {
      fetchAssets(token);
    }
  }, [token, currentView]);

  useEffect(() => {
    if (token && currentView === "huertas") {
      fetchFarms(token);
    }
  }, [token, currentView]);

useEffect(() => {
  if (token && currentView === "dashboard") {
    if (isAgricola) {
      fetchFarms(token).then(() => {
        loadHuertasGraphs();
      });
      return;
    }

    if (isAdmin || isFinanzas) {
      fetchGlobalDashboard(token);
    }

    if (isAdmin) {
      fetchDashboardSummary(token);
      fetchAssets(token);
    }

    if (isAdmin || isFinanzas) {
      fetchFarms(token);
    }
  }
}, [token, currentView, user]);


  const generatedCode = useMemo(() => {
    const selectedTypeObj = TYPE_OPTIONS.find(
      (item) => item.value === assetForm.type
    );
    const selectedFunctionObj = FUNCTION_OPTIONS.find(
      (item) => item.value === assetForm.function
    );

    if (
      !selectedTypeObj ||
      !selectedFunctionObj ||
      !assetForm.code_number.trim()
    ) {
      return "";
    }

    return `${selectedTypeObj.abbr}-${selectedFunctionObj.abbr}-${assetForm.code_number
      .trim()
      .toUpperCase()}`;
  }, [assetForm.type, assetForm.function, assetForm.code_number]);

  const filteredAssets = useMemo(() => {
    const search = assetSearch.trim().toUpperCase();

    if (!search) return assets;

    return assets.filter((item) =>
      [
        item.code,
        item.type,
        item.brand,
        item.model,
        item.year,
        item.function,
        item.responsible,
        item.numero_asignado,
        item.observation
      ]
        .map((value) => String(value || "").toUpperCase())
        .some((value) => value.includes(search))
    );
  }, [assets, assetSearch]);

  const toUpperValue = (value) => value.toUpperCase();

  const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/uploads/")) {
    return `${API_URL}${fileUrl}`;
  }

  return `${API_URL}/files/${fileUrl}`;
};

  const fetchMe = async (currentToken) => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        handleLogout();
        return;
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "agricola") {
        setCurrentView("dashboard");
      } else if (data.role === "inventario") {
        setCurrentView("assets");
      } else if (data.role === "viewer") {
        setCurrentView("huertas");
      } else {
        setCurrentView("dashboard");
      }

    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error de login");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      if (data.user.role === "agricola") {
        setCurrentView("dashboard");
      } else if (data.user.role === "inventario") {
        setCurrentView("assets");
      } else if (data.user.role === "viewer") {
        setCurrentView("huertas");
      } else {
        setCurrentView("dashboard");
      }


      await fetchMe(data.token);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async (currentToken = token) => {
    try {
      setLoadingAssets(true);

      const res = await fetch(`${API_URL}/assets`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando vehículos");
        return;
      }

      setAssets(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchFarms = async (currentToken = token) => {
    try {
      setLoadingFarms(true);

      const res = await fetch(`${API_URL}/farms`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando huertas");
        return;
      }

      setFarms(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setLoadingFarms(false);
    }
  };


  const fetchDashboardSummary = async (currentToken = token) => {
  try {
    setLoadingDashboardSummary(true);

    const res = await fetch(`${API_URL}/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error cargando resumen dashboard");
      return;
    }

    setDashboardSummary(data);
  } catch (err) {
    console.error(err);
    alert("Error conectando al servidor");
  } finally {
    setLoadingDashboardSummary(false);
  }
};
  const fetchGlobalDashboard = async (currentToken = token) => {
    try {
      setLoadingGlobalDashboard(true);

      const res = await fetch(`${API_URL}/dashboard/global`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando dashboard global");
        return;
      }

      setGlobalDashboard({
        totals: data.totals || {
          total_cuts: 0,
          total_boxes: 0,
          total_income: 0,
          avg_price: 0
        },
        byMonth: data.byMonth || [],
        byFarm: data.byFarm || [],
        byColor: data.byColor || []
      });
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setLoadingGlobalDashboard(false);
    }
  };

  const fetchFarmFiles = async (farmId) => {
    try {
      const res = await fetch(`${API_URL}/farms/${farmId}/files`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando archivos");
        return;
      }

      setFarmFiles(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando archivos");
    }
  };

  const handleAssetInputChange = (field, value) => {
    if (field === "type" || field === "function") {
      setAssetForm((prev) => ({
        ...prev,
        [field]: value
      }));
      return;
    }

    setAssetForm((prev) => ({
      ...prev,
      [field]: toUpperValue(value)
    }));
  };

  const handlePhotoChange = (file) => {
    setSelectedPhoto(file || null);

    if (!file) {
      setPhotoPreview("");
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetAssetForm = () => {
    setAssetForm(emptyAssetForm);
    setEditingAssetId(null);
    setSelectedPhoto(null);
    setPhotoPreview("");
  };

  const uploadPhotoForAsset = async (assetId) => {
    if (!selectedPhoto) return null;

    const formData = new FormData();
    formData.append("photo", selectedPhoto);

    const res = await fetch(`${API_URL}/assets/${assetId}/photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error subiendo foto");
    }

    return data.asset;
  };

  const handleSaveAsset = async () => {
    try {
      if (!assetForm.type || !assetForm.function || !assetForm.code_number.trim()) {
        alert("TIPO, FUNCIÓN Y NÚMERO CÓDIGO SON OBLIGATORIOS");
        return;
      }

      setSavingAsset(true);

      const payload = {
        type: assetForm.type,
        function: assetForm.function,
        code_number: assetForm.code_number.trim().toUpperCase(),
        brand: assetForm.brand.trim() || null,
        model: assetForm.model.trim() || null,
        year: assetForm.year ? Number(assetForm.year) : null,
        responsible: assetForm.responsible.trim() || null,
        observation: assetForm.observation.trim() || null,
        numero_asignado: assetForm.numero_asignado.trim() || null
      };

      const url = editingAssetId
        ? `${API_URL}/assets/${editingAssetId}`
        : `${API_URL}/assets`;

      const method = editingAssetId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error guardando vehículo");
        return;
      }

      const savedAsset = data.asset;

      if (selectedPhoto) {
        await uploadPhotoForAsset(savedAsset.id);
      }

      alert(editingAssetId ? "VEHÍCULO ACTUALIZADO" : "VEHÍCULO CREADO");
      resetAssetForm();
      fetchAssets();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error conectando al servidor");
    } finally {
      setSavingAsset(false);
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      type: asset.type || "",
      function: asset.function || "",
      code_number: asset.code_number || "",
      brand: asset.brand || "",
      model: asset.model || "",
      year: asset.year || "",
      responsible: asset.responsible || "",
      observation: asset.observation || "",
      numero_asignado: asset.numero_asignado || ""
    });

    setSelectedPhoto(null);
    setPhotoPreview(resolveFileUrl(asset.image_url));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAsset = async (id) => {
    try {
      const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE VEHÍCULO?");
      if (!ok) return;

      const res = await fetch(`${API_URL}/assets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error eliminando vehículo");
        return;
      }

      alert("VEHÍCULO ELIMINADO");

      if (editingAssetId === id) resetAssetForm();
      if (detailAsset?.id === id) setDetailAsset(null);

      fetchAssets();
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const handleExportExcel = () => {
    const rows = filteredAssets.map((item) => ({
      CODIGO: item.code || "",
      TIPO: item.type || "",
      MARCA: item.brand || "",
      MODELO: item.model || "",
      AÑO: item.year || "",
      FUNCION: item.function || "",
      RESPONSABLE: item.responsible || "",
      NUMERO_ASIGNADO: item.numero_asignado || "",
      OBSERVACION: item.observation || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VEHICULOS");
    XLSX.writeFile(workbook, "vehiculos.xlsx");
  };

  const handleFarmInputChange = (field, value) => {
    setFarmForm((prev) => ({
      ...prev,
      [field]: toUpperValue(value)
    }));
  };

  const handleFarmPdfChange = (files) => {
    const selected = Array.from(files || []);

    const invalid = selected.some((file) => file.type !== "application/pdf");

    if (invalid) {
      alert("SOLO SE PERMITEN ARCHIVOS PDF");
      return;
    }

    setFarmPdfFiles(selected);
  };

  const handleFarmPhotoFilesChange = (files) => {
    const selected = Array.from(files || []);

    const invalid = selected.some((file) => !file.type.startsWith("image/"));

    if (invalid) {
      alert("SOLO SE PERMITEN IMÁGENES");
      return;
    }

    setFarmPhotoFiles(selected);
  };

  const resetFarmForm = () => {
    setFarmForm(emptyFarmForm);
    setFarmPdfFiles([]);
    setFarmPhotoFiles([]);
    setEditingFarmId(null);
  };

  const uploadFarmFiles = async (farmId) => {
    if (farmPdfFiles.length === 0 && farmPhotoFiles.length === 0) return;

    const formData = new FormData();

    farmPdfFiles.forEach((file) => {
      formData.append("pdfs", file);
    });

    farmPhotoFiles.forEach((file) => {
      formData.append("photos", file);
    });

    const res = await fetch(`${API_URL}/farms/${farmId}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error subiendo archivos");
    }

    return data.files;
  };

  const handleSaveFarm = async () => {
    try {
      if (!farmForm.code.trim() || !farmForm.name.trim()) {
        alert("CÓDIGO Y NOMBRE SON OBLIGATORIOS");
        return;
      }

      setSavingFarm(true);

      const payload = {
        code: farmForm.code.trim(),
        name: farmForm.name.trim(),
        estado: farmForm.estado.trim() || null,
        region: farmForm.region.trim() || null,
        sector: farmForm.sector.trim() || null,
        coordenadas: farmForm.coordenadas.trim() || null,
        maps_link: farmForm.maps_link.trim() || null,
        hectareas: farmForm.hectareas ? Number(farmForm.hectareas) : null,
        numero_terrenos: farmForm.numero_terrenos
          ? Number(farmForm.numero_terrenos)
          : null,
        tipo_suelos: farmForm.tipo_suelos.trim() || null,
        variedad_banano: farmForm.variedad_banano.trim() || null,
        edad_plantacion: farmForm.edad_plantacion.trim() || null,
        sistema_riego: farmForm.sistema_riego.trim() || null,
        fuente_agua: farmForm.fuente_agua.trim() || null,
        bomba_agua: farmForm.bomba_agua.trim() || null,
        prop_medidor_elec: farmForm.prop_medidor_elec.trim() || null,
        empacadora: farmForm.empacadora.trim() || null,
        a_favor_de: farmForm.a_favor_de.trim() || null,
        produccion_est_mensual: farmForm.produccion_est_mensual
          ? Number(farmForm.produccion_est_mensual)
          : null,
        produccion_est_anual: farmForm.produccion_est_anual
          ? Number(farmForm.produccion_est_anual)
          : null,
        encargado: farmForm.encargado.trim() || null,
        telefono_encargado: farmForm.telefono_encargado.trim() || null,
        empresa_compradora: farmForm.empresa_compradora.trim() || null
      };

      const url = editingFarmId
        ? `${API_URL}/farms/${editingFarmId}`
        : `${API_URL}/farms`;

      const method = editingFarmId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error guardando huerta");
        return;
      }

      const savedFarm = data.farm;

      if (farmPdfFiles.length > 0 || farmPhotoFiles.length > 0) {
        await uploadFarmFiles(savedFarm.id);
      }

      alert(editingFarmId ? "HUERTA ACTUALIZADA" : "HUERTA CREADA");

      resetFarmForm();
      setHuertasView("list");
      fetchFarms();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error conectando al servidor");
    } finally {
      setSavingFarm(false);
    }
  };

  const handleDeleteFarm = async (id) => {
    try {
      const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTA HUERTA?");
      if (!ok) return;

      const res = await fetch(`${API_URL}/farms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error eliminando huerta");
        return;
      }

      alert("HUERTA ELIMINADA");

      if (selectedFarm?.id === id) {
        setSelectedFarm(null);
        setHuertasView("list");
      }

      fetchFarms();
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const handleAddFilesToFarm = async () => {
    try {
      if (!selectedFarm) return;

      if (farmPdfFiles.length === 0 && farmPhotoFiles.length === 0) {
        alert("SELECCIONA AL MENOS UN PDF O UNA FOTO");
        return;
      }

      setAddingFiles(true);

      await uploadFarmFiles(selectedFarm.id);

      alert("ARCHIVOS AGREGADOS");
      setFarmPdfFiles([]);
      setFarmPhotoFiles([]);

      await fetchFarmFiles(selectedFarm.id);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error subiendo archivos");
    } finally {
      setAddingFiles(false);
    }
  };

  const handleDeleteFarmFile = async (fileId) => {
    try {
      if (!selectedFarm) return;

      const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE ARCHIVO?");
      if (!ok) return;

      const res = await fetch(`${API_URL}/farm-files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error eliminando archivo");
        return;
      }

      alert("ARCHIVO ELIMINADO");

      await fetchFarmFiles(selectedFarm.id);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const resetCutForm = () => {
    setCutForm(emptyCutForm);
    setEditingCutId(null);
  };

  const handleCutInputChange = (field, value) => {
    if (field === "boxes_produced" || field === "price_per_box" || field === "cut_date") {
      setCutForm((prev) => ({ ...prev, [field]: value }));
      return;
    }

    setCutForm((prev) => ({ ...prev, [field]: toUpperValue(value) }));
  };

  const calculatedGrossIncome = useMemo(() => {
    const boxes = Number(cutForm.boxes_produced || 0);
    const price = Number(cutForm.price_per_box || 0);
    return boxes * price;
  }, [cutForm.boxes_produced, cutForm.price_per_box]);

  const addDaysToDate = (dateString, days) => {
    const date = new Date(`${String(dateString).slice(0, 10)}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date;
  };

  const formatCutDate = (date) => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).toUpperCase();
  };

  const getDaysDifference = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const fetchFarmCuts = async (farmId, filters = cutsFilter) => {
    try {
      setLoadingCuts(true);
      const params = new URLSearchParams();
      if (filters.year) params.append("year", filters.year);
      if (filters.month) params.append("month", filters.month);

      const url = `${API_URL}/farms/${farmId}/cuts${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando cortes");
        return;
      }

      setFarmCuts(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setLoadingCuts(false);
    }
  };

  const fetchAllFarmCuts = async (farmId) => {
    try {
      const res = await fetch(`${API_URL}/farms/${farmId}/cuts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando todos los cortes");
        return;
      }

      setAllFarmCuts(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const fetchFarmCutsSummary = async (farmId) => {
    try {
      const res = await fetch(`${API_URL}/farms/${farmId}/cuts-summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error cargando resumen de cortes");
        return;
      }

      setFarmCutsSummary(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const handleSaveCut = async () => {
    try {
      if (!selectedFarm) return;

      if (!cutForm.cut_date) {
        alert("FECHA DE CORTE ES OBLIGATORIA");
        return;
      }

      if (!cutForm.boxes_produced) {
        alert("CAJAS PRODUCIDAS ES OBLIGATORIO");
        return;
      }

      if (canSeeMoney && !cutForm.price_per_box) {
        alert("PRECIO POR CAJA ES OBLIGATORIO");
        return;
      }


      setSavingCut(true);

      const payload = {
        cut_date: cutForm.cut_date,
        color: cutForm.color || null,
        boxes_produced: Number(cutForm.boxes_produced || 0),
        buyer_company: cutForm.buyer_company.trim() || null,
        box_design: cutForm.box_design.trim() || null,
        observation: cutForm.observation.trim() || null
      };

      payload.price_per_box = canSeeMoney
      ? Number(cutForm.price_per_box || 0)
      : 0;
      const res = await fetch(`${API_URL}/farms/${selectedFarm.id}/cuts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error guardando corte");
        return;
      }
      alert(
      isAgricola
        ? "CORTE GUARDADO. QUEDA PENDIENTE PARA FINANZAS."
        : "CORTE GUARDADO"
      );

      resetCutForm();

      const allFilter = { year: null, month: null };
      setCutsFilter(allFilter);
      await fetchFarmCuts(selectedFarm.id, allFilter);
      await fetchAllFarmCuts(selectedFarm.id);
      await fetchFarmCutsSummary(selectedFarm.id);
      setHuertasView("cuts");
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    } finally {
      setSavingCut(false);
    }
  };

  const handleDeleteCut = async (cutId) => {
    try {
      if (!selectedFarm) return;

      const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE CORTE?");
      if (!ok) return;

      const res = await fetch(`${API_URL}/farm-cuts/${cutId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error eliminando corte");
        return;
      }

      alert("CORTE ELIMINADO");
      await fetchFarmCuts(selectedFarm.id, cutsFilter);
      await fetchAllFarmCuts(selectedFarm.id);
      await fetchFarmCutsSummary(selectedFarm.id);
    } catch (err) {
      console.error(err);
      alert("Error conectando al servidor");
    }
  };

  const openAddCut = () => {
    resetCutForm();
    setHuertasView("addCut");
  };
  const openEditCut = (cut) => {
    setEditingCutId(cut.id);
    setCutForm({
      cut_date: String(cut.cut_date || "").slice(0, 10),
      color: cut.color || "",
      boxes_produced: cut.boxes_produced || "",
      price_per_box: cut.price_per_box || "",
      buyer_company: cut.buyer_company || "",
      box_design: cut.box_design || "",
      observation: cut.observation || ""
    });
    setHuertasView("addCut");
  };
  const openCutsView = async () => {
    if (!selectedFarm) return;

    const allFilter = { year: null, month: null };
    setCutsFilter(allFilter);
    setHuertasView("cuts");
    await fetchFarmCuts(selectedFarm.id, allFilter);
    await fetchAllFarmCuts(selectedFarm.id);
    await fetchFarmCutsSummary(selectedFarm.id);
  };

  const applyCutsFilter = async (year = null, month = null) => {
    if (!selectedFarm) return;

    const nextFilter = { year, month };
    setCutsFilter(nextFilter);
    await fetchFarmCuts(selectedFarm.id, nextFilter);
  };

  const getAvailableYears = () => {
    const years = [...new Set(farmCutsSummary.map((item) => Number(item.cut_year)))];
    return years.sort((a, b) => b - a);
  };

  const getMonthsForYear = (year) => {
    return farmCutsSummary
      .filter((item) => Number(item.cut_year) === Number(year))
      .map((item) => Number(item.cut_month))
      .filter((month, index, arr) => arr.indexOf(month) === index)
      .sort((a, b) => a - b);
  };

  const totalCutsBoxes = farmCuts.reduce(
    (total, item) => total + Number(item.boxes_produced || 0),
    0
  );

  const totalCutsIncome = farmCuts.reduce(
    (total, item) => total + Number(item.gross_income || 0),
    0
  );

  const averagePricePerBox = totalCutsBoxes > 0 ? totalCutsIncome / totalCutsBoxes : 0;

  const monthlyCutsDashboard = useMemo(() => {
    const map = {};

    farmCuts.forEach((cut) => {
      const year = Number(cut.cut_year);
      const month = Number(cut.cut_month);
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          key,
          year,
          month,
          label: `${MONTH_NAMES[month] || month} ${year}`,
          boxes: 0,
          income: 0,
          cuts: 0
        };
      }

      map[key].boxes += Number(cut.boxes_produced || 0);
      map[key].income += Number(cut.gross_income || 0);
      map[key].cuts += 1;
    });

    return Object.values(map).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [farmCuts]);

  const bestMonth = useMemo(() => {
    if (monthlyCutsDashboard.length === 0) return null;
    return [...monthlyCutsDashboard].sort((a, b) => b.income - a.income)[0];
  }, [monthlyCutsDashboard]);


  const productionAlerts = useMemo(() => {
    const alerts = [];

  const pendingMoneyCuts = farmCuts.filter(
    (cut) => Number(cut.price_per_box || 0) === 0
  );

  if (canSeeMoney && pendingMoneyCuts.length > 0) {
    alerts.push({
      type: "warning",
      title: "Cortes pendientes de precio",
      message: `Hay ${pendingMoneyCuts.length} corte(s) sin precio por caja. Finanzas o admin debe completar los valores monetarios.`
    });
}

    if (farmCuts.length === 0) {
      alerts.push({
        type: "danger",
        title: "Sin cortes registrados",
        message: "No hay cortes en el filtro seleccionado."
      });
      return alerts;
    }

    if (averagePricePerBox > 0 && averagePricePerBox < 5) {
      alerts.push({
        type: "warning",
        title: "Precio promedio bajo",
        message: `El precio promedio por caja está en $${averagePricePerBox.toFixed(2)}.`
      });
    }

    monthlyCutsDashboard.forEach((month) => {
      if (month.boxes < 100) {
        alerts.push({
          type: "warning",
          title: `Producción baja - ${month.label}`,
          message: `Solo se registraron ${month.boxes.toLocaleString()} cajas.`
        });
      }
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const hasCurrentMonth = allFarmCuts.some(
      (cut) => Number(cut.cut_year) === currentYear && Number(cut.cut_month) === currentMonth
    );

    if (!hasCurrentMonth && !cutsFilter.year && !cutsFilter.month) {
      alerts.push({
        type: "info",
        title: "Mes actual sin cortes",
        message: `No hay cortes registrados en ${MONTH_NAMES[currentMonth]} ${currentYear}.`
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "success",
        title: "Producción estable",
        message: "No se detectaron alertas importantes en este filtro."
      });
    }

    return alerts;
  }, [farmCuts, allFarmCuts, monthlyCutsDashboard, averagePricePerBox, cutsFilter]);
  const exportFarmCutsExcel = () => {
    if (!selectedFarm) return;

    const rows = farmCuts.map((cut) => ({
      HUERTA: selectedFarm.name || "",
      CODIGO_HUERTA: selectedFarm.code || "",
      FECHA_CORTE: String(cut.cut_date || "").slice(0, 10),
      AÑO: cut.cut_year || "",
      MES: MONTH_NAMES[Number(cut.cut_month)] || cut.cut_month || "",
      COLOR: cut.color || "",
      CAJAS_PRODUCIDAS: Number(cut.boxes_produced || 0),
      PRECIO_POR_CAJA: Number(cut.price_per_box || 0),
      EMPRESA_COMPRADORA: cut.buyer_company || "",
      DISEÑO_CAJA: cut.box_design || "",
      INGRESO_BRUTO: Number(cut.gross_income || 0),
      OBSERVACION: cut.observation || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CORTES");

    const filterName = cutsFilter.year
      ? cutsFilter.month
        ? `${cutsFilter.year}_${MONTH_NAMES[cutsFilter.month]}`
        : `${cutsFilter.year}`
      : "TODO";

    XLSX.writeFile(
      workbook,
      `cortes_${selectedFarm.code || selectedFarm.name}_${filterName}.xlsx`
    );
  };

  const openFarmDetail = async (farm) => {
    setSelectedFarm(farm);
    setFarmPdfFiles([]);
    setFarmPhotoFiles([]);
    setFarmCuts([]);
    setAllFarmCuts([]);
    setFarmCutsSummary([]);
    setCutsFilter({ year: null, month: null });
    setHuertasView("detail");
    await fetchFarmFiles(farm.id);
  };

  const openNewHuerta = () => {
    resetFarmForm();
    setHuertasView("new");
  };

  const openEditHuerta = (farm) => {
    setEditingFarmId(farm.id);

    setFarmForm({
      code: farm.code || "",
      name: farm.name || "",
      estado: farm.estado || "",
      region: farm.region || "",
      sector: farm.sector || "",
      coordenadas: farm.coordenadas || "",
      maps_link: farm.maps_link || "",
      hectareas: farm.hectareas || "",
      numero_terrenos: farm.numero_terrenos || "",
      tipo_suelos: farm.tipo_suelos || "",
      variedad_banano: farm.variedad_banano || "",
      edad_plantacion: farm.edad_plantacion || "",
      sistema_riego: farm.sistema_riego || "",
      fuente_agua: farm.fuente_agua || "",
      bomba_agua: farm.bomba_agua || "",
      prop_medidor_elec: farm.prop_medidor_elec || "",
      empacadora: farm.empacadora || "",
      a_favor_de: farm.a_favor_de || "",
      produccion_est_mensual: farm.produccion_est_mensual || "",
      produccion_est_anual: farm.produccion_est_anual || "",
      encargado: farm.encargado || "",
      telefono_encargado: farm.telefono_encargado || "",
      empresa_compradora: farm.empresa_compradora || ""
    });

    setFarmPdfFiles([]);
    setFarmPhotoFiles([]);
    setHuertasView("new");
  };

  const backToHuertasList = () => {
    setHuertasView("list");
    setSelectedFarm(null);
    setFarmFiles([]);
    setFarmPdfFiles([]);
    setFarmPhotoFiles([]);
    setFarmCuts([]);
    setAllFarmCuts([]);
    setFarmCutsSummary([]);
    setCutsFilter({ year: null, month: null });
    resetCutForm();
    setEditingFarmId(null);
  };

  const loadHuertasGraphs = async () => {
  try {
    setLoadingGraphs(true);

    let farmsList = farms;

    if (farmsList.length === 0) {
      const resFarms = await fetch(`${API_URL}/farms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dataFarms = await resFarms.json();

      if (!resFarms.ok) {
        alert(dataFarms.error || "Error cargando huertas");
        return;
      }

      farmsList = dataFarms;
      setFarms(dataFarms);
    }

    const allCuts = [];

    for (const farm of farmsList) {
      const resCuts = await fetch(`${API_URL}/farms/${farm.id}/cuts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dataCuts = await resCuts.json();

      if (resCuts.ok) {
        dataCuts.forEach((cut) => {
          allCuts.push({
            ...cut,
            farm_id: farm.id,
            farm_code: farm.code,
            farm_name: farm.name
          });
        });
      }
    }

    setGraphCuts(allCuts);
  } catch (err) {
    console.error(err);
    alert("Error cargando gráficos");
  } finally {
    setLoadingGraphs(false);
  }
};

  const openHuertasGraphs = async () => {
    setHuertasView("graphs");
    await loadHuertasGraphs();
  };


  const closeDetail = () => {
    setDetailAsset(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setEmail("");
    setPassword("");
    setAssets([]);
    setCurrentView("dashboard");
    setAssetSearch("");
    resetAssetForm();
    setDetailAsset(null);
    setFarms([]);
    resetFarmForm();
    setSelectedFarm(null);
    setFarmFiles([]);
    setFarmCuts([]);
    setAllFarmCuts([]);
    setFarmCutsSummary([]);
    setCutsFilter({ year: null, month: null });
    resetCutForm();
    setHuertasView("list");
  };

  const globalMonthlyData = useMemo(() => {
    return (globalDashboard.byMonth || []).map((item) => ({
      label: `${MONTH_NAMES[Number(item.cut_month)] || item.cut_month} ${item.cut_year}`,
      cajas: Number(item.total_boxes || 0),
      ingresos: Number(item.total_income || 0),
      utilidad: Number(item.total_profit || 0),
      cortes: Number(item.total_cuts || 0)
    }));
  }, [globalDashboard.byMonth]);

  const globalFarmRanking = useMemo(() => {
    return [...(globalDashboard.byFarm || [])]
      .map((item) => ({
        ...item,
        total_boxes: Number(item.total_boxes || 0),
        total_income: Number(item.total_income || 0),
        total_cuts: Number(item.total_cuts || 0)
      }))
      .sort((a, b) => b.total_boxes - a.total_boxes)
      .slice(0, 8);
  }, [globalDashboard.byFarm]);

  const globalBestFarm = globalFarmRanking.length > 0 ? globalFarmRanking[0] : null;

  const globalBestMonth = useMemo(() => {
    if (globalMonthlyData.length === 0) return null;
    return [...globalMonthlyData].sort((a, b) => b.ingresos - a.ingresos)[0];
  }, [globalMonthlyData]);

  const globalFarmIncomeRanking = useMemo(() => {
    return [...(globalDashboard.byFarm || [])]
      .map((item) => ({
        ...item,
        total_boxes: Number(item.total_boxes || 0),
        total_income: Number(item.total_income || 0),
        total_cuts: Number(item.total_cuts || 0)
      }))
      .sort((a, b) => b.total_income - a.total_income)
      .slice(0, 8);
  }, [globalDashboard.byFarm]);

  const globalMonthlyAveragePriceData = useMemo(() => {
    return globalMonthlyData.map((item) => ({
      ...item,
      precioPromedio: item.cajas > 0 ? Number((item.ingresos / item.cajas).toFixed(2)) : 0
    }));
  }, [globalMonthlyData]);

  const globalYearComparisonData = useMemo(() => {
    const grouped = {};

    (globalDashboard.byMonth || []).forEach((item) => {
      const month = Number(item.cut_month);
      const year = String(item.cut_year);

      if (!grouped[month]) {
        grouped[month] = { month, mes: MONTH_NAMES[month] || `MES ${month}` };
      }

      grouped[month][year] = Number(item.total_boxes || 0);
    });

    return Object.values(grouped).sort((a, b) => a.month - b.month);
  }, [globalDashboard.byMonth]);

  const globalYearsForComparison = useMemo(() => {
    return [...new Set((globalDashboard.byMonth || []).map((item) => String(item.cut_year)))]
      .sort((a, b) => Number(a) - Number(b));
  }, [globalDashboard.byMonth]);

  const exportGlobalDashboardExcel = () => {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          TOTAL_CORTES: Number(globalDashboard.totals?.total_cuts || 0),
          TOTAL_CAJAS: Number(globalDashboard.totals?.total_boxes || 0),
          TOTAL_INGRESOS: Number(globalDashboard.totals?.total_income || 0),
          PRECIO_PROMEDIO: Number(globalDashboard.totals?.avg_price || 0),
          TOTAL_HUERTAS: farms.length
        }
      ]),
      "RESUMEN"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(globalMonthlyData),
      "POR_MES"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(globalFarmRanking),
      "RANKING_CAJAS"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(globalFarmIncomeRanking),
      "RANKING_INGRESOS"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(globalMonthlyAveragePriceData),
      "PRECIO_PROM_MES"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(globalYearComparisonData),
      "COMPARATIVO_ANUAL"
    );

    XLSX.writeFile(workbook, "dashboard_global_bp_group.xlsx");
  };

  const fetchAssetFiles = async (assetId) => {
  const res = await fetch(`${API_URL}/assets/${assetId}/files`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error cargando archivos");
    return;
  }

  setAssetFiles(data);
};

const openAssetFiles = async (asset) => {
  setSelectedAsset(asset);
  setAssetPhotoFiles([]);
  setAssetPdfFiles([]);
  await fetchAssetFiles(asset.id);
  setCurrentView("assetFiles");
};

const handleAssetPhotoFilesChange = (files) => {
  setAssetPhotoFiles(Array.from(files || []));
};

const handleAssetPdfFilesChange = (files) => {
  const selected = Array.from(files || []);
  const invalid = selected.some((file) => file.type !== "application/pdf");

  if (invalid) {
    alert("SOLO SE PERMITEN ARCHIVOS PDF");
    return;
  }

  setAssetPdfFiles(selected);
};

const uploadAssetFiles = async () => {
  if (!selectedAsset) return;

  if (assetPhotoFiles.length === 0 && assetPdfFiles.length === 0) {
    alert("SELECCIONA AL MENOS UN ARCHIVO");
    return;
  }

  try {
    setUploadingAssetFiles(true);

    const formData = new FormData();

    assetPhotoFiles.forEach((file) => formData.append("photos", file));
    assetPdfFiles.forEach((file) => formData.append("pdfs", file));

    const res = await fetch(`${API_URL}/assets/${selectedAsset.id}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error subiendo archivos");
      return;
    }

    alert("ARCHIVOS SUBIDOS");
    setAssetPhotoFiles([]);
    setAssetPdfFiles([]);
    await fetchAssetFiles(selectedAsset.id);
  } catch (err) {
    console.error(err);
    alert("Error conectando al servidor");
  } finally {
    setUploadingAssetFiles(false);
  }
};

const handleDeleteAssetFile = async (fileId) => {
  if (!selectedAsset) return;

  const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE ARCHIVO?");
  if (!ok) return;

  const res = await fetch(`${API_URL}/asset-files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error eliminando archivo");
    return;
  }

  alert("ARCHIVO ELIMINADO");
  await fetchAssetFiles(selectedAsset.id);
};
  const renderAssetDetail = () => {
    if (!detailAsset) return null;

    return (
      <div style={styles.modalOverlay} onClick={closeDetail}>
        <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={{ margin: 0 }}>Ficha del vehículo</h2>
            <button style={styles.closeButton} onClick={closeDetail}>
              X
            </button>
          </div>

          <div style={styles.detailGrid}>
            <div style={styles.detailLeft}>
              {detailAsset.image_url ? (
                <img
                  src={resolveFileUrl(detailAsset.image_url)}
                  alt={detailAsset.code}
                  style={styles.detailImage}
                />
              ) : (
                <div style={styles.noImageBox}>SIN FOTO</div>
              )}
            </div>

            <div style={styles.detailRight}>
              <div style={styles.detailItem}>
                <strong>CÓDIGO:</strong> {detailAsset.code || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>TIPO:</strong> {detailAsset.type || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>MARCA:</strong> {detailAsset.brand || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>MODELO:</strong> {detailAsset.model || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>AÑO:</strong> {detailAsset.year || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>FUNCIÓN:</strong> {detailAsset.function || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>RESPONSABLE:</strong> {detailAsset.responsible || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>NÚMERO ASIGNADO:</strong>{" "}
                {detailAsset.numero_asignado || "-"}
              </div>
              <div style={styles.detailItem}>
                <strong>OBSERVACIÓN:</strong> {detailAsset.observation || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNewHuertaForm = () => {
    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>
            {editingFarmId ? "Editar Huerta" : "Nueva Huerta"}
          </h1>
          <button style={styles.cancelButton} onClick={backToHuertasList}>
            Volver
          </button>
        </div>

        <div style={styles.formCard}>
          <div style={styles.formGridThree}>
            <input
              style={styles.input}
              placeholder="CÓDIGO"
              value={farmForm.code}
              onChange={(e) => handleFarmInputChange("code", e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="NOMBRE"
              value={farmForm.name}
              onChange={(e) => handleFarmInputChange("name", e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="ESTADO"
              value={farmForm.estado}
              onChange={(e) => handleFarmInputChange("estado", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="REGIÓN"
              value={farmForm.region}
              onChange={(e) => handleFarmInputChange("region", e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="SECTOR"
              value={farmForm.sector}
              onChange={(e) => handleFarmInputChange("sector", e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="COORDENADAS"
              value={farmForm.coordenadas}
              onChange={(e) =>
                handleFarmInputChange("coordenadas", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="LINK DE MAPS"
              value={farmForm.maps_link}
              onChange={(e) =>
                handleFarmInputChange("maps_link", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="HECTÁREAS"
              value={farmForm.hectareas}
              onChange={(e) =>
                handleFarmInputChange("hectareas", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="N° DE TERRENOS"
              value={farmForm.numero_terrenos}
              onChange={(e) =>
                handleFarmInputChange("numero_terrenos", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="TIPO DE SUELOS"
              value={farmForm.tipo_suelos}
              onChange={(e) =>
                handleFarmInputChange("tipo_suelos", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="VARIEDAD DE BANANO"
              value={farmForm.variedad_banano}
              onChange={(e) =>
                handleFarmInputChange("variedad_banano", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="EDAD DE PLANTACIÓN"
              value={farmForm.edad_plantacion}
              onChange={(e) =>
                handleFarmInputChange("edad_plantacion", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="SISTEMA DE RIEGO"
              value={farmForm.sistema_riego}
              onChange={(e) =>
                handleFarmInputChange("sistema_riego", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="FUENTE DE AGUA"
              value={farmForm.fuente_agua}
              onChange={(e) =>
                handleFarmInputChange("fuente_agua", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="BOMBA DE AGUA"
              value={farmForm.bomba_agua}
              onChange={(e) =>
                handleFarmInputChange("bomba_agua", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="PROP. MEDIDOR ELÉC."
              value={farmForm.prop_medidor_elec}
              onChange={(e) =>
                handleFarmInputChange("prop_medidor_elec", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="EMPACADORA"
              value={farmForm.empacadora}
              onChange={(e) =>
                handleFarmInputChange("empacadora", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="A FAVOR DE"
              value={farmForm.a_favor_de}
              onChange={(e) =>
                handleFarmInputChange("a_favor_de", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="PRODUCCIÓN EST. MENSUAL"
              value={farmForm.produccion_est_mensual}
              onChange={(e) =>
                handleFarmInputChange(
                  "produccion_est_mensual",
                  e.target.value
                )
              }
            />
            <input
              style={styles.input}
              placeholder="PRODUCCIÓN EST. ANUAL"
              value={farmForm.produccion_est_anual}
              onChange={(e) =>
                handleFarmInputChange("produccion_est_anual", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="ENCARGADO"
              value={farmForm.encargado}
              onChange={(e) =>
                handleFarmInputChange("encargado", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="TELÉFONO ENCARGADO"
              value={farmForm.telefono_encargado}
              onChange={(e) =>
                handleFarmInputChange("telefono_encargado", e.target.value)
              }
            />
            <input
              style={styles.input}
              placeholder="EMPRESA COMPRADORA"
              value={farmForm.empresa_compradora}
              onChange={(e) =>
                handleFarmInputChange("empresa_compradora", e.target.value)
              }
            />
          </div>

          <div style={styles.uploadsBox}>
            <div style={styles.uploadSection}>
              <label style={styles.uploadLabel}>PDFS </label>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => handleFarmPdfChange(e.target.files)}
              />
              <div style={styles.fileList}>
                {farmPdfFiles.length === 0
                  ? "NO HAY PDFS SELECCIONADOS"
                  : farmPdfFiles.map((file, index) => (
                      <div key={index}>{file.name}</div>
                    ))}
              </div>
            </div>

            <div style={styles.uploadSection}>
              <label style={styles.uploadLabel}>FOTOS</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFarmPhotoFilesChange(e.target.files)}
              />
              <div style={styles.fileList}>
                {farmPhotoFiles.length === 0
                  ? "NO HAY FOTOS SELECCIONADAS"
                  : farmPhotoFiles.map((file, index) => (
                      <div key={index}>{file.name}</div>
                    ))}
              </div>
            </div>
          </div>
          
          
 
          <div style={styles.formButtons}>
            <button
              style={styles.saveButton}
              onClick={handleSaveFarm}
              disabled={savingFarm}
            >
              {savingFarm
                ? "Guardando..."
                : editingFarmId
                ? "Actualizar huerta"
                : "Guardar huerta"}
            </button>

            <button style={styles.cancelButton} onClick={backToHuertasList}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddCutForm = () => {
    if (!selectedFarm) return null;

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Agregar Corte - {selectedFarm.name}</h1>
          <div style={styles.headerActions}>
            <button style={styles.cancelButton} onClick={() => setHuertasView("detail")}>
              Volver al resumen
            </button>
          </div>
        </div>

        <div style={styles.formCard}>
          <div style={styles.formGridThree}>
            <input
              style={styles.input}
              type="date"
              value={cutForm.cut_date}
              onChange={(e) => handleCutInputChange("cut_date", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="COLORES / DESCRIPCIÓN DE COLORES"
              value={cutForm.color}
              onChange={(e) => handleCutInputChange("color", e.target.value)}
            />

            <input
              style={styles.input}
              type="number"
              placeholder="CAJAS PRODUCIDAS"
              value={cutForm.boxes_produced}
              onChange={(e) => handleCutInputChange("boxes_produced", e.target.value)}
            />

          {canSeeMoney && (
            <input
              style={styles.input}
              type="number"
              placeholder="PRECIO POR CAJA"
              value={cutForm.price_per_box}
              onChange={(e) => handleCutInputChange("price_per_box", e.target.value)}
            />
          )}

            <input
              style={styles.input}
              placeholder="EMPRESA COMPRADORA"
              value={cutForm.buyer_company}
              onChange={(e) => handleCutInputChange("buyer_company", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="DISEÑO DE CAJA"
              value={cutForm.box_design}
              onChange={(e) => handleCutInputChange("box_design", e.target.value)}
            />
            {canSeeMoney && (
            <input
              style={{ ...styles.input, background: "#EFE7D5", fontWeight: "bold" }}
              value={`INGRESO BRUTO: $${calculatedGrossIncome.toFixed(2)}`}
              readOnly
            />
            )}

            <input
              style={styles.input}
              placeholder="OBSERVACIÓN"
              value={cutForm.observation}
              onChange={(e) => handleCutInputChange("observation", e.target.value)}
            />
          </div>



          <div style={styles.formButtons}>
            <button style={styles.saveButton} onClick={handleSaveCut} disabled={savingCut}>
              {savingCut ? "Guardando..." : "Guardar corte"}
            </button>

            <button style={styles.cancelButton} onClick={() => setHuertasView("detail")}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCutsContent = () => {
    if (!selectedFarm) return null;

    const years = getAvailableYears();
    const maxBoxes = Math.max(...monthlyCutsDashboard.map((item) => item.boxes), 1);
    const maxIncome = Math.max(...monthlyCutsDashboard.map((item) => item.income), 1);
    const filterTitle = cutsFilter.year
      ? cutsFilter.month
        ? `${MONTH_NAMES[cutsFilter.month]} ${cutsFilter.year}`
        : `AÑO ${cutsFilter.year}`
      : "TODO EL TIEMPO";

    return (
      <div>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard de Cortes - {selectedFarm.name}</h1>
            <div style={styles.subTitle}>Filtro activo: {filterTitle}</div>
          </div>

          <div style={styles.headerActions}>


              {(isAdmin || isAgricola || user?.role === "agricola") && (
                <button style={styles.saveButton} onClick={openAddCut}>
                  Agregar Corte
              </button>
              )}

            <button style={styles.exportButton} onClick={exportFarmCutsExcel}>
              Exportar Excel
            </button>

            <button style={styles.cancelButton} onClick={() => setHuertasView("detail")}>
              Volver al resumen
            </button>
          </div>
        </div>

        <div style={styles.cutLayout}>
          <div style={styles.cutSidebar}>
            <div style={styles.filterTitle}>Filtros</div>

            <button
              style={!cutsFilter.year && !cutsFilter.month ? styles.cutFilterActive : styles.cutFilterButton}
              onClick={() => applyCutsFilter(null, null)}
            >
              Todo el tiempo
            </button>

            {years.length === 0 ? (
              <div style={styles.emptyText}>No hay cortes registrados.</div>
            ) : (
              years.map((year) => (
                <div key={year} style={styles.yearBlock}>
                  <button
                    style={cutsFilter.year === year && !cutsFilter.month ? styles.cutFilterActive : styles.cutFilterButton}
                    onClick={() => applyCutsFilter(year, null)}
                  >
                    {year}
                  </button>

                  <div style={styles.monthList}>
                    {getMonthsForYear(year).map((month) => (
                      <button
                        key={`${year}-${month}`}
                        style={cutsFilter.year === year && cutsFilter.month === month ? styles.monthButtonActive : styles.monthButton}
                        onClick={() => applyCutsFilter(year, month)}
                      >
                        {MONTH_NAMES[month]}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.cutMain}>



            <div style={styles.proCardsGrid}>
              <div style={styles.metricCardDark}>
                <div style={styles.metricLabel}>Cortes mostrados</div>
                <div style={styles.metricValue}>{farmCuts.length}</div>
                <div style={styles.metricHint}>registros</div>
              </div>

              <div style={styles.metricCardGold}>
                <div style={styles.metricLabelDark}>Total cajas</div>
                <div style={styles.metricValueDark}>{totalCutsBoxes.toLocaleString()}</div>
                <div style={styles.metricHintDark}>cajas producidas</div>
              </div>

              <div style={styles.metricCardDark}>
                <div style={styles.metricLabel}>Ingreso bruto</div>
                <div style={styles.metricValue}>${totalCutsIncome.toLocaleString()}</div>
                <div style={styles.metricHint}>total del filtro</div>
              </div>

              <div style={styles.metricCardWhite}>
                <div style={styles.metricLabelDark}>Precio promedio</div>
                <div style={styles.metricValueDark}>${averagePricePerBox.toFixed(2)}</div>
                <div style={styles.metricHintDark}>por caja</div>
              </div>
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h2 style={styles.chartTitle}>Cajas por mes</h2>
                  <span style={styles.chartBadge}>Producción</span>
                </div>

                {monthlyCutsDashboard.length === 0 ? (
                  <div style={styles.emptyChart}>Sin datos para graficar.</div>
                ) : (
                  <div style={styles.barChart}>
                    {monthlyCutsDashboard.map((item) => (
                      <div key={`boxes-${item.key}`} style={styles.barRow}>
                        <div style={styles.barLabel}>{item.label}</div>
                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.barFillGold,
                              width: `${Math.max((item.boxes / maxBoxes) * 100, 4)}%`
                            }}
                          />
                        </div>
                        <div style={styles.barValue}>{item.boxes.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h2 style={styles.chartTitle}>Ingresos por mes</h2>
                  <span style={styles.chartBadge}>Dinero</span>
                </div>

                {monthlyCutsDashboard.length === 0 ? (
                  <div style={styles.emptyChart}>Sin datos para graficar.</div>
                ) : (
                  <div style={styles.barChart}>
                    {monthlyCutsDashboard.map((item) => (
                      <div key={`income-${item.key}`} style={styles.barRow}>
                        <div style={styles.barLabel}>{item.label}</div>
                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.barFillDark,
                              width: `${Math.max((item.income / maxIncome) * 100, 4)}%`
                            }}
                          />
                        </div>
                        <div style={styles.barValue}>${item.income.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.alertAndBestGrid}>
              <div style={styles.alertCard}>
                <h2 style={styles.chartTitle}>Alertas de producción</h2>
                <div style={styles.alertList}>
                  {productionAlerts.map((alert, index) => (
                    <div key={index} style={styles.alertItem}>
                      <div style={styles.alertIcon}>
                        {alert.type === "success" ? "✓" : alert.type === "danger" ? "!" : "⚠"}
                      </div>
                      <div>
                        <div style={styles.alertTitle}>{alert.title}</div>
                        <div style={styles.alertMessage}>{alert.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.bestMonthCard}>
                <div style={styles.metricLabel}>Mejor mes</div>
                <div style={styles.bestMonthTitle}>{bestMonth ? bestMonth.label : "SIN DATOS"}</div>
                <div style={styles.bestMonthValue}>
                  {bestMonth ? `$${bestMonth.income.toLocaleString()}` : "$0"}
                </div>
                <div style={styles.metricHint}>Ingreso bruto más alto</div>
              </div>
            </div>

            <div style={styles.cutTableContainer}>
              {loadingCuts ? (
                <p>Cargando cortes...</p>
              ) : farmCuts.length === 0 ? (
                <p>No hay cortes para este filtro.</p>
              ) : (
                <table style={styles.cutsTable}>
                  <thead>
                    <tr>
                      <th style={styles.cutTh}>FECHA</th>
                      <th style={styles.cutTh}>COLOR</th>
                      <th style={styles.cutTh}>CAJAS</th>
                      {canSeeMoney && <th style={styles.cutTh}>PRECIO</th>}
                      <th style={styles.cutTh}>COMPRADORA</th>
                      <th style={styles.cutTh}>DISEÑO</th>
                      {canSeeMoney && <th style={styles.cutTh}>INGRESO</th>}
                      <th style={styles.cutTh}>OBSERVACIÓN</th>
                      {canSeeMoney && <th style={styles.cutTh}>ACCIONES</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {farmCuts.map((cut) => (
                      <tr key={cut.id}>
                        <td style={styles.cutTd}>{String(cut.cut_date || "").slice(0, 10)}</td>
                        <td style={styles.cutTd}>{cut.color || "-"}</td>
                        <td style={styles.cutTd}>{Number(cut.boxes_produced || 0).toLocaleString()}</td>
                        
                        {canSeeMoney && (
                          <td style={styles.cutTd}>
                            ${Number(cut.price_per_box || 0).toFixed(2)}
                          </td>
                        )}

                        <td style={styles.cutTd}>{cut.buyer_company || "-"}</td>
                        <td style={styles.cutTd}>{cut.box_design || "-"}</td>            
                        {canSeeMoney && (
                          <td style={styles.cutTd}>
                            ${Number(cut.gross_income || 0).toLocaleString()}
                          </td>
                        )}
                        <td style={styles.cutTd}>{cut.observation || "-"}</td>

                        {canSeeMoney && (
                          <td style={styles.cutTd}>
                            <button style={styles.editButton} onClick={() => openEditCut(cut)}>
                             Editar
                            </button>

                          {isAdmin && (
                            <button style={styles.smallDeleteButton} onClick={() => handleDeleteCut(cut.id)}>
                            Eliminar
                            </button>
                          )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
const huertasGraphData = useMemo(() => {
  const byFarm = {};
  const byMonth = {};
  const byFarmMonth = {};

  graphCuts.forEach((cut) => {
    const farmKey = `${cut.farm_code || ""} ${cut.farm_name || ""}`.trim();
    const monthKey = `${MONTH_NAMES[Number(cut.cut_month)] || cut.cut_month} ${cut.cut_year}`;

    if (!byFarm[farmKey]) {
      byFarm[farmKey] = {
        farm: farmKey,
        cajas: 0,
        cortes: 0,
        ingresos: 0
      };
    }

    byFarm[farmKey].cajas += Number(cut.boxes_produced || 0);
    byFarm[farmKey].cortes += 1;
    byFarm[farmKey].ingresos += Number(cut.gross_income || 0);

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        mes: monthKey,
        cajas: 0,
        cortes: 0,
        ingresos: 0
      };
    }

    byMonth[monthKey].cajas += Number(cut.boxes_produced || 0);
    byMonth[monthKey].cortes += 1;
    byMonth[monthKey].ingresos += Number(cut.gross_income || 0);

    const farmMonthKey = `${farmKey}-${monthKey}`;

    if (!byFarmMonth[farmMonthKey]) {
      byFarmMonth[farmMonthKey] = {
        farm: farmKey,
        mes: monthKey,
        cajas: 0,
        cortes: 0,
        ingresos: 0
      };
    }

    byFarmMonth[farmMonthKey].cajas += Number(cut.boxes_produced || 0);
    byFarmMonth[farmMonthKey].cortes += 1;
    byFarmMonth[farmMonthKey].ingresos += Number(cut.gross_income || 0);
  });

  const farmRanking = Object.values(byFarm).sort((a, b) => b.cajas - a.cajas);
  const monthlyGeneral = Object.values(byMonth);
  const farmMonthly = Object.values(byFarmMonth);

  const bestMonthByFarm = farmRanking.map((farm) => {
    const months = farmMonthly
      .filter((item) => item.farm === farm.farm)
      .sort((a, b) => b.cajas - a.cajas);

    return {
      farm: farm.farm,
      mejorMes: months[0]?.mes || "SIN DATOS",
      cajas: months[0]?.cajas || 0,
      cortes: months[0]?.cortes || 0
    };
  });

  return {
    farmRanking,
    monthlyGeneral,
    bestMonthByFarm
  };
}, [graphCuts]);

  const renderHuertasContent = () => {

    if (huertasView === "graphs") {
  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Gráficos de Huertas</h1>
        <button style={styles.cancelButton} onClick={backToHuertasList}>
          Volver
        </button>
      </div>

      {loadingGraphs ? (
        <div style={styles.placeholderBox}>Cargando gráficos...</div>
      ) : graphCuts.length === 0 ? (
        <div style={styles.placeholderBox}>
          No hay cortes registrados para graficar.
        </div>
      ) : (
        <>
          <div style={styles.proCardsGrid}>
            <div style={styles.metricCardDark}>
              <div style={styles.metricLabel}>Total cajas</div>
              <div style={styles.metricValue}>
                {huertasGraphData.farmRanking
                  .reduce((sum, item) => sum + item.cajas, 0)
                  .toLocaleString()}
              </div>
              <div style={styles.metricHint}>producción total</div>
            </div>

            <div style={styles.metricCardGold}>
              <div style={styles.metricLabelDark}>Total cortes</div>
              <div style={styles.metricValueDark}>
                {graphCuts.length.toLocaleString()}
              </div>
              <div style={styles.metricHintDark}>cortes registrados</div>
            </div>

            <div style={styles.metricCardWhite}>
              <div style={styles.metricLabelDark}>Huertas con cortes</div>
              <div style={styles.metricValueDark}>
                {huertasGraphData.farmRanking.length}
              </div>
              <div style={styles.metricHintDark}>huertas activas</div>
            </div>

            <div style={styles.metricCardDark}>
              <div style={styles.metricLabel}>Mejor huerta</div>
              <div style={styles.metricValue}>
                {huertasGraphData.farmRanking[0]?.farm || "SIN DATOS"}
              </div>
              <div style={styles.metricHint}>por cajas producidas</div>
            </div>
          </div>

          <div style={styles.dashboardGrid}>
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h2 style={styles.chartTitle}>Cajas por huertas</h2>
                <span style={styles.chartBadge}>Producción</span>
              </div>

              <div style={styles.rechartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={huertasGraphData.farmRanking}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="farm" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cajas" fill="#B88935" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h2 style={styles.chartTitle}>Cajas generales por mes</h2>
                <span style={styles.chartBadge}>Global</span>
              </div>

              <div style={styles.rechartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={huertasGraphData.monthlyGeneral}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cajas"
                      stroke="#B88935"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h2 style={styles.chartTitle}>Mejor mes de cada huerta</h2>
              <span style={styles.chartBadge}>Por huerta</span>
            </div>

            <div style={styles.rankingList}>
              {huertasGraphData.bestMonthByFarm.map((item, index) => (
                <div key={index} style={styles.rankingRow}>
                  <div style={styles.rankingNumber}>{index + 1}</div>

                  <div style={styles.rankingInfo}>
                    <div style={styles.rankingTitle}>{item.farm}</div>
                    <div style={styles.rankingSubtitle}>
                      Mejor mes: {item.mejorMes} · {item.cortes} cortes
                    </div>
                  </div>

                  <div style={styles.rankingValue}>
                    {item.cajas.toLocaleString()} cajas
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canSeeMoney && (
            <div style={styles.dashboardGrid}>
              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h2 style={styles.chartTitle}>Ingresos por huerta</h2>
                  <span style={styles.chartBadge}>Admin / Finanzas</span>
                </div>

                <div style={styles.rechartBox}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={huertasGraphData.farmRanking}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="farm" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="ingresos" fill="#111111" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h2 style={styles.chartTitle}>Ingresos generales por mes</h2>
                  <span style={styles.chartBadge}>Admin / Finanzas</span>
                </div>

                <div style={styles.rechartBox}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={huertasGraphData.monthlyGeneral}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#111111"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

    if (huertasView === "new") {
      return renderNewHuertaForm();
    }

    if (huertasView === "addCut") {
      return renderAddCutForm();
    }

    if (huertasView === "cuts") {
      return renderCutsContent();
    }

    if (huertasView === "detail" && selectedFarm) {
      const pdfs = farmFiles.filter((file) => file.file_type === "PDF");
      const photos = farmFiles.filter((file) => file.file_type === "PHOTO");

      return (
        <div>
          <div style={styles.pageHeader}>
            
            <h1 style={styles.pageTitle}>
              {selectedFarm.code} {selectedFarm.name}
            </h1>

            <div style={styles.headerActions}>
              {isAdmin && (
                <button
                  style={styles.editButton}
                  onClick={() => openEditHuerta(selectedFarm)}
                >
                  Editar huerta
                </button>
              )}

              {(isAdmin || isAgricola || user?.role === "agricola") && (
              <button style={styles.saveButton} onClick={openAddCut}>
                Agregar Corte
              </button>
              )}

              <button style={styles.exportButton} onClick={openCutsView}>
                Ver Cortes
              </button>

              <button style={styles.cancelButton} onClick={backToHuertasList}>
                Volver
              </button>
            </div>
          </div>

          <div style={styles.detailFarmCard}>
            <div style={styles.detailFarmGridMobile}>
              <div><strong>ESTADO:</strong> {selectedFarm.estado || "-"}</div>
              <div><strong>REGIÓN:</strong> {selectedFarm.region || "-"}</div>
              <div><strong>SECTOR:</strong> {selectedFarm.sector || "-"}</div>
              <div><strong>COORDENADAS:</strong> {selectedFarm.coordenadas || "-"}</div>
              <div><strong>LINK DE MAPS:</strong> {selectedFarm.maps_link || "-"}</div>
              <div><strong>HECTÁREAS:</strong> {selectedFarm.hectareas || "-"}</div>
              <div><strong>N° DE TERRENOS:</strong> {selectedFarm.numero_terrenos || "-"}</div>
              <div><strong>TIPO DE SUELOS:</strong> {selectedFarm.tipo_suelos || "-"}</div>
              <div><strong>VARIEDAD DE BANANO:</strong> {selectedFarm.variedad_banano || "-"}</div>
              <div><strong>EDAD DE PLANTACIÓN:</strong> {selectedFarm.edad_plantacion || "-"}</div>
              <div><strong>SISTEMA DE RIEGO:</strong> {selectedFarm.sistema_riego || "-"}</div>
              <div><strong>FUENTE DE AGUA:</strong> {selectedFarm.fuente_agua || "-"}</div>
              <div><strong>BOMBA DE AGUA:</strong> {selectedFarm.bomba_agua || "-"}</div>
              <div><strong>PROP. MEDIDOR ELÉC.:</strong> {selectedFarm.prop_medidor_elec || "-"}</div>
              <div><strong>EMPACADORA:</strong> {selectedFarm.empacadora || "-"}</div>
              <div><strong>A FAVOR DE:</strong> {selectedFarm.a_favor_de || "-"}</div>
              <div><strong>PRODUCCIÓN EST. MENSUAL:</strong> {selectedFarm.produccion_est_mensual || "-"}</div>
              <div><strong>PRODUCCIÓN EST. ANUAL:</strong> {selectedFarm.produccion_est_anual || "-"}</div>
              <div><strong>ENCARGADO:</strong> {selectedFarm.encargado || "-"}</div>
              <div><strong>TELÉFONO ENCARGADO:</strong> {selectedFarm.telefono_encargado || "-"}</div>
              <div><strong>EMPRESA COMPRADORA:</strong> {selectedFarm.empresa_compradora || "-"}</div>
            </div>

            <div style={styles.filesSection}>
              <h2>Documentos PDF</h2>

              {pdfs.length === 0 ? (
                <p>No hay PDFs cargados.</p>
              ) : (
                pdfs.map((file) => (
                  <div key={file.id} style={styles.fileRowWithAction}>
                    <a
                      href={resolveFileUrl(file.file_url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {file.file_name}
                    </a>
                    

                    
                    {isAdmin && (
                      <button
                        style={styles.smallDeleteButton}
                        onClick={() => handleDeleteFarmFile(file.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))
              )}

              <h2 style={{ marginTop: 24 }}>Fotos</h2>

              {photos.length === 0 ? (
                <p>No hay fotos cargadas.</p>
              ) : (
                <div style={styles.photoGrid}>
                  {photos.map((file) => (
                    <div key={file.id} style={styles.photoItem}>
                      <a
                        href={resolveFileUrl(file.file_url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={resolveFileUrl(file.file_url)}
                          alt={file.file_name}
                          style={styles.farmPhoto}
                        />
                      </a>

                      {isAdmin && (
                        <button
                          style={styles.smallDeleteButton}
                          onClick={() => handleDeleteFarmFile(file.id)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div style={styles.uploadsBox}>
                  <div style={styles.uploadSection}>
                    <label style={styles.uploadLabel}>AGREGAR PDFS</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => handleFarmPdfChange(e.target.files)}
                    />
                    <div style={styles.fileList}>
                      {farmPdfFiles.map((file, index) => (
                        <div key={index}>{file.name}</div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.uploadSection}>
                    <label style={styles.uploadLabel}>AGREGAR FOTOS</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        handleFarmPhotoFilesChange(e.target.files)
                      }
                    />
                    <div style={styles.fileList}>
                      {farmPhotoFiles.map((file, index) => (
                        <div key={index}>{file.name}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    style={styles.saveButton}
                    onClick={handleAddFilesToFarm}
                    disabled={addingFiles}
                  >
                    {addingFiles ? "Subiendo..." : "Agregar archivos"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Huertas</h1>

          <div style={styles.headerActions}>
            {isAdmin && (
              <button style={styles.saveButton} onClick={openNewHuerta}>
                Nueva huerta
              </button>
            )}

            <button style={styles.exportButton} onClick={openHuertasGraphs}>
              Gráficos
            </button>
          </div>
        </div>

        {loadingFarms ? (
          <p>Cargando huertas...</p>
        ) : (
    <div style={styles.huertasGridPremium}>
  {farms.length === 0 ? (
    <div style={styles.emptyState}>No hay huertas registradas</div>
  ) : (
    farms.map((farm) => (
      <div key={farm.id} style={styles.huertaCardPremium}>
        <button
          style={styles.huertaCardMain}
          onClick={() => openFarmDetail(farm)}
        >
          <div style={styles.huertaIcon}>🌿</div>

          <div style={styles.huertaInfo}>
            <div style={styles.huertaCodePremium}>
              {farm.code || "SIN-CODIGO"}
            </div>

            <div style={styles.huertaNamePremium}>
              {farm.name}
            </div>
          </div>

          <div style={styles.huertaArrow}>Ver →</div>
        </button>

        {isAdmin && (
          <button
            style={styles.huertaDeleteButtonPremium}
            onClick={() => handleDeleteFarm(farm.id)}
          >
            Eliminar
          </button>
        )}
      </div>
    ))
  )}
</div>
        )}
      </div>
    );
  };
  

const handleExportStaffExcel = () => {
  const rows = staff.map((employee) => ({
    AREA: employee.area || "",
    NOMBRE: employee.full_name || "",
    CURP: employee.curp || "",
    COMPANIA: employee.company || "",
    FECHA_NACIMIENTO: employee.birth_date
      ? String(employee.birth_date).slice(0, 10)
      : "",
    TELEFONO: employee.phone || "",
    DIRECCION: employee.address || "",
    CONTACTO_1_NOMBRE: employee.emergency_contact_1_name || "",
    CONTACTO_1_TELEFONO: employee.emergency_contact_1_phone || "",
    CONTACTO_2_NOMBRE: employee.emergency_contact_2_name || "",
    CONTACTO_2_TELEFONO: employee.emergency_contact_2_phone || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "PERSONAL");

  const fileName =
    selectedStaffArea === "TODOS"
      ? "personal_todas_las_areas.xlsx"
      : `personal_${selectedStaffArea}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

const fetchStaffFiles = async (staffId) => {
  const res = await fetch(`${API_URL}/staff/${staffId}/files`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error cargando archivos");
    return;
  }

  setStaffFiles(data);
};

const openStaffFiles = async (employee) => {
  setSelectedStaff(employee);
  setStaffIneFiles([]);
  setStaffPdfFiles([]);
  await fetchStaffFiles(employee.id);
  setStaffView("files");
};

const handleStaffIneChange = (files) => {
  setStaffIneFiles(Array.from(files || []));
};

const handleStaffPdfChange = (files) => {
  const selected = Array.from(files || []);
  const invalid = selected.some((file) => file.type !== "application/pdf");

  if (invalid) {
    alert("SOLO SE PERMITEN ARCHIVOS PDF");
    return;
  }

  setStaffPdfFiles(selected);
};

const uploadStaffFiles = async () => {
  if (!selectedStaff) return;

  if (staffIneFiles.length === 0 && staffPdfFiles.length === 0) {
    alert("SELECCIONA AL MENOS UN ARCHIVO");
    return;
  }

  try {
    setUploadingStaffFiles(true);

    const formData = new FormData();

    staffIneFiles.forEach((file) => {
      formData.append("ine", file);
    });

    staffPdfFiles.forEach((file) => {
      formData.append("pdfs", file);
    });

    const res = await fetch(`${API_URL}/staff/${selectedStaff.id}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error subiendo archivos");
      return;
    }

    alert("ARCHIVOS SUBIDOS");
    setStaffIneFiles([]);
    setStaffPdfFiles([]);
    await fetchStaffFiles(selectedStaff.id);
  } catch (err) {
    console.error(err);
    alert("Error conectando al servidor");
  } finally {
    setUploadingStaffFiles(false);
  }
};

const handleDeleteStaffFile = async (fileId) => {
  if (!selectedStaff) return;

  const ok = window.confirm("¿SEGURO QUE QUIERES ELIMINAR ESTE ARCHIVO?");
  if (!ok) return;

  const res = await fetch(`${API_URL}/staff-files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error eliminando archivo");
    return;
  }

  alert("ARCHIVO ELIMINADO");
  await fetchStaffFiles(selectedStaff.id);
};
  const renderStaffContent = () => {
  if (staffView === "areas") {
    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Personal</h1>
        </div>

        <div style={styles.proCardsGrid}>
          {STAFF_AREAS.map((area) => (
            <button
              key={area.value}
              style={styles.metricCardWhite}
              onClick={() => openStaffArea(area.value)}
            >
              <div style={styles.metricLabelDark}>Personal</div>
              <div style={styles.metricValueDark}>{area.label.replace("Personal ", "")}</div>
              <div style={styles.metricHintDark}>Ver listado</div>
              
            
            </button>
          ))}
        </div>
      </div>
    );
  }
if (staffView === "files" && selectedStaff) {
  const ines = staffFiles.filter((file) => file.file_type === "INE");
  const pdfs = staffFiles.filter((file) => file.file_type === "PDF");

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Archivos de {selectedStaff.full_name}</h1>
          <div style={styles.subTitle}>{selectedStaff.area}</div>
        </div>

        <button style={styles.cancelButton} onClick={() => setStaffView("list")}>
          Volver
        </button>
      </div>

      <div style={styles.formCard}>
        <div style={styles.uploadsBox}>
          <div style={styles.uploadSection}>
            <label style={styles.uploadLabel}>FOTOS / INE</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => handleStaffIneChange(e.target.files)}
            />
            <div style={styles.fileList}>
              {staffIneFiles.map((file, index) => (
                <div key={index}>{file.name}</div>
              ))}
            </div>
          </div>

          <div style={styles.uploadSection}>
            <label style={styles.uploadLabel}>PDFS</label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => handleStaffPdfChange(e.target.files)}
            />
            <div style={styles.fileList}>
              {staffPdfFiles.map((file, index) => (
                <div key={index}>{file.name}</div>
              ))}
            </div>
          </div>

          <button
            style={styles.saveButton}
            onClick={uploadStaffFiles}
            disabled={uploadingStaffFiles}
          >
            {uploadingStaffFiles ? "Subiendo..." : "Subir archivos"}
          </button>
        </div>
      </div>

      <div style={styles.detailFarmCard}>
        <h2>Fotos / INE</h2>

        {ines.length === 0 ? (
          <p>No hay fotos/INE cargados.</p>
        ) : (
          <div style={styles.photoGrid}>
            {ines.map((file) => (
              <div key={file.id} style={styles.photoItem}>
                <a href={resolveFileUrl(file.file_url)} target="_blank" rel="noreferrer">
                  {file.file_url?.toLowerCase().endsWith(".pdf") ? (
                    file.file_name
                  ) : (
                    <img
                      src={resolveFileUrl(file.file_url)}
                      alt={file.file_name}
                      style={styles.farmPhoto}
                    />
                  )}
                </a>

                <button
                  style={styles.smallDeleteButton}
                  onClick={() => handleDeleteStaffFile(file.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>PDFs</h2>

        {pdfs.length === 0 ? (
          <p>No hay PDFs cargados.</p>
        ) : (
          pdfs.map((file) => (
            <div key={file.id} style={styles.fileRowWithAction}>
              <a href={resolveFileUrl(file.file_url)} target="_blank" rel="noreferrer">
                {file.file_name}
              </a>

              <button
                style={styles.smallDeleteButton}
                onClick={() => handleDeleteStaffFile(file.id)}
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
  if (staffView === "form") {
    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>
            {editingStaffId ? "Editar empleado" : "Nuevo empleado"}
          </h1>

          <button style={styles.cancelButton} onClick={() => setStaffView("list")}>
            Volver
          </button>
        </div>

        <div style={styles.formCard}>
          <div style={styles.formGridThree}>
            <input
              style={styles.input}
              placeholder="CURP"
              value={staffForm.curp}
              onChange={(e) => handleStaffInputChange("curp", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="NOMBRES COMPLETOS"
              value={staffForm.full_name}
              onChange={(e) => handleStaffInputChange("full_name", e.target.value)}
            />

            <input
              style={styles.input}
              type="date"
              value={staffForm.birth_date}
              onChange={(e) => handleStaffInputChange("birth_date", e.target.value)}
            />
            <input
              style={{ ...styles.input, background: "#E2E8F0", fontWeight: "bold" }}
              value={`ÁREA: ${staffForm.area || selectedStaffArea}`}
              readOnly
            />

            <input
              style={styles.input}
              placeholder="COMPAÑÍA"
              value={staffForm.company}
              onChange={(e) => handleStaffInputChange("company", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="TELÉFONO"
              value={staffForm.phone}
              onChange={(e) => handleStaffInputChange("phone", e.target.value)}
            />

            <input
              style={{ ...styles.input, gridColumn: "span 3" }}
              placeholder="DIRECCIÓN DE DOMICILIO"
              value={staffForm.address}
              onChange={(e) => handleStaffInputChange("address", e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="CONTACTO EMERGENCIA 1 - NOMBRE"
              value={staffForm.emergency_contact_1_name}
              onChange={(e) =>
                handleStaffInputChange("emergency_contact_1_name", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="CONTACTO EMERGENCIA 1 - TELÉFONO"
              value={staffForm.emergency_contact_1_phone}
              onChange={(e) =>
                handleStaffInputChange("emergency_contact_1_phone", e.target.value)
              }
            />

            <div />

            <input
              style={styles.input}
              placeholder="CONTACTO EMERGENCIA 2 - NOMBRE"
              value={staffForm.emergency_contact_2_name}
              onChange={(e) =>
                handleStaffInputChange("emergency_contact_2_name", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="CONTACTO EMERGENCIA 2 - TELÉFONO"
              value={staffForm.emergency_contact_2_phone}
              onChange={(e) =>
                handleStaffInputChange("emergency_contact_2_phone", e.target.value)
              }
            />
          </div>

{!editingStaffId && (
  <div style={styles.uploadsBox}>
    <div style={styles.uploadSection}>
      <label style={styles.uploadLabel}>FOTOS / INE</label>
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => handleStaffIneChange(e.target.files)}
      />
      <div style={styles.fileList}>
        {staffIneFiles.length === 0
          ? "NO HAY ARCHIVOS SELECCIONADOS"
          : staffIneFiles.map((file, index) => <div key={index}>{file.name}</div>)}
      </div>
    </div>

    <div style={styles.uploadSection}>
      <label style={styles.uploadLabel}>PDFS</label>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => handleStaffPdfChange(e.target.files)}
      />
      <div style={styles.fileList}>
        {staffPdfFiles.length === 0
          ? "NO HAY PDFS SELECCIONADOS"
          : staffPdfFiles.map((file, index) => <div key={index}>{file.name}</div>)}
      </div>
    </div>
  </div>
)}

          <div style={styles.formButtons}>
            <button style={styles.saveButton} onClick={handleSaveStaff}>
              {editingStaffId ? "Actualizar empleado" : "Guardar empleado"}
            </button>

            <button style={styles.cancelButton} onClick={() => setStaffView("list")}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            {STAFF_AREAS.find((a) => a.value === selectedStaffArea)?.label || "Personal"}
          </h1>
          <div style={styles.subTitle}>Área: {selectedStaffArea}</div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.saveButton} onClick={openNewStaff}>
            Nuevo empleado
          </button>
          <button style={styles.exportButton} onClick={handleExportStaffExcel}>
            Exportar Excel
          </button>
          <button style={styles.cancelButton} onClick={() => setStaffView("areas")}>
            Volver
          </button>
        </div>
      </div>

      {loadingStaff ? (
        <p>Cargando personal...</p>
      ) : staff.length === 0 ? (
        <div style={styles.placeholderBox}>No hay empleados registrados en esta área.</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                
                <th style={styles.th}>NOMBRE</th>
                <th style={styles.th}>CURP</th>
                <th style={styles.th}>ÁREA</th>
                <th style={styles.th}>COMPAÑÍA</th>
                <th style={styles.th}>NACIMIENTO</th>
                <th style={styles.th}>TELÉFONO</th>
                <th style={styles.th}>DIRECCIÓN</th>
                <th style={styles.th}>EMERGENCIA 1</th>
                <th style={styles.th}>EMERGENCIA 2</th>
                <th style={styles.th}>ACCIONES</th>

              </tr>
            </thead>

            <tbody>
              {staff.map((employee) => (





                <tr key={employee.id}>

                  <td style={styles.td}>{employee.full_name || "-"}</td>
                  <td style={styles.td}>{employee.curp || "-"}</td>
                  <td style={styles.td}>{employee.area || "-"}</td>
                  <td style={styles.td}>{employee.company || "-"}</td>
                  <td style={styles.td}>{employee.birth_date ? String(employee.birth_date).slice(0, 10) : "-"}</td>
                  <td style={styles.td}>{employee.phone || "-"}</td>
                  <td style={styles.td}>{employee.address || "-"}</td>
                  <td style={styles.td}>
                    {(employee.emergency_contact_1_name || "-") + " / " + (employee.emergency_contact_1_phone || "-")}
                  </td>
                  <td style={styles.td}>
                     {(employee.emergency_contact_2_name || "-") + " / " + (employee.emergency_contact_2_phone || "-")}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionsCell}>
                      <button
                        style={styles.viewButton}
                        onClick={() => openStaffFiles(employee)}
                      >
                        Archivos
                      </button>

                      <button
                        style={styles.editButton}
                        onClick={() => openEditStaff(employee)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteStaff(employee.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const renderAgricolaDashboard = () => {
  const totalCajas = graphCuts.reduce(
    (sum, cut) => sum + Number(cut.boxes_produced || 0),
    0
  );

  const totalCortes = graphCuts.length;

  const huertasConCortes = [
    ...new Set(graphCuts.map((cut) => cut.farm_id))
  ].length;

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard Agrícola</h1>
          <p style={styles.dashboardSubtitle}>
            Producción y actividad de cortes de tus huertas.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadHuertasGraphs}>
          Recargar
        </button>
      </div>

      {loadingGraphs ? (
        <div style={styles.placeholderBox}>Cargando dashboard agrícola...</div>
      ) : (
        <>
          <div style={styles.proCardsGrid}>
            <div style={styles.metricCardDark}>
              <div style={styles.metricLabel}>Total cajas</div>
              <div style={styles.metricValue}>{totalCajas.toLocaleString()}</div>
              <div style={styles.metricHint}>producción registrada</div>
            </div>

            <div style={styles.metricCardGold}>
              <div style={styles.metricLabelDark}>Cortes</div>
              <div style={styles.metricValueDark}>{totalCortes}</div>
              <div style={styles.metricHintDark}>cortes registrados</div>
            </div>

            <div style={styles.metricCardWhite}>
              <div style={styles.metricLabelDark}>Huertas activas</div>
              <div style={styles.metricValueDark}>{huertasConCortes}</div>
              <div style={styles.metricHintDark}>con cortes</div>
            </div>

            <div style={styles.metricCardDark}>
              <div style={styles.metricLabel}>Huertas asignadas</div>
              <div style={styles.metricValue}>{farms.length}</div>
              <div style={styles.metricHint}>registradas</div>
            </div>
          </div>

          <div style={styles.dashboardGrid}>
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h2 style={styles.chartTitle}>Ranking de huertas por cajas</h2>
                <span style={styles.chartBadge}>Producción</span>
              </div>

              {huertasGraphData.farmRanking.length === 0 ? (
                <div style={styles.emptyChart}>Sin huertas con producción.</div>
              ) : (
                <div style={styles.rankingList}>
                  {huertasGraphData.farmRanking.map((farm, index) => (
                    <div key={index} style={styles.rankingRow}>
                      <div style={styles.rankingNumber}>{index + 1}</div>
                      <div style={styles.rankingInfo}>
                        <div style={styles.rankingTitle}>{farm.farm}</div>
                        <div style={styles.rankingSubtitle}>
                          {farm.cortes} cortes
                        </div>
                      </div>
                      <div style={styles.rankingValue}>
                        {farm.cajas.toLocaleString()} cajas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h2 style={styles.chartTitle}>Cajas por mes</h2>
                <span style={styles.chartBadge}>Producción</span>
              </div>

              {huertasGraphData.monthlyGeneral.length === 0 ? (
                <div style={styles.emptyChart}>Sin datos para graficar.</div>
              ) : (
                <div style={styles.rechartBox}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={huertasGraphData.monthlyGeneral}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cajas" fill="#B88935" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h2 style={styles.chartTitle}>Mejor mes de cada huerta</h2>
              <span style={styles.chartBadge}>Por huerta</span>
            </div>

            {huertasGraphData.bestMonthByFarm.length === 0 ? (
              <div style={styles.emptyChart}>Sin datos registrados.</div>
            ) : (
              <div style={styles.rankingList}>
                {huertasGraphData.bestMonthByFarm.map((item, index) => (
                  <div key={index} style={styles.rankingRow}>
                    <div style={styles.rankingNumber}>{index + 1}</div>
                    <div style={styles.rankingInfo}>
                      <div style={styles.rankingTitle}>{item.farm}</div>
                      <div style={styles.rankingSubtitle}>
                        Mejor mes: {item.mejorMes} · {item.cortes} cortes
                      </div>
                    </div>
                    <div style={styles.rankingValue}>
                      {item.cajas.toLocaleString()} cajas
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
  const renderContent = () => {
    if (currentView === "dashboard") {
      if (isAgricola) {
      return renderAgricolaDashboard();
    }

    const totals = globalDashboard.totals || {};
    const summaryTotals = dashboardSummary.totals || {};
    return (
      
        <div>
          <div style={styles.pageHeader}>
            <div>
              <h1 style={styles.pageTitle}>Dashboard Global BP Group</h1>
            </div>

            <div style={styles.headerActions}>
              <button style={styles.exportButton} onClick={exportGlobalDashboardExcel}>
                Exportar Dashboard Excel
              </button>

              <button style={styles.refreshButton} onClick={() => fetchGlobalDashboard()}>
                Recargar
              </button>
            </div>
          </div>

          {loadingGlobalDashboard ? (
            <div style={styles.placeholderBox}>Cargando dashboard global...</div>
          ) : (
            <>
              <div style={styles.proCardsGrid}>
                <div style={styles.metricCardDark}>
                  <div style={styles.metricLabel}>Total cajas</div>
                  <div style={styles.metricValue}>
                    {Number(totals.total_boxes || 0).toLocaleString()}
                  </div>
                  <div style={styles.metricHint}>todas las huertas</div>
                </div>

                <div style={styles.metricCardGold}>
                  <div style={styles.metricLabelDark}>Ingreso bruto</div>
                  <div style={styles.metricValueDark}>
                    ${Number(globalDashboard.totals?.total_income || 0).toLocaleString()}
                  </div>
                  <div style={styles.metricHintDark}>ingreso bruto histórico</div>
                </div>

                <div style={styles.metricCardDark}>
                  <div style={styles.metricLabel}>Total utilidades</div>
                  <div style={styles.metricValue}>
                    ${Number(totals.total_profit || 0).toLocaleString()}
                  </div>
                  <div style={styles.metricHint}>utilidad neta histórica</div>
                </div>

                <div style={styles.metricCardWhite}>
                  <div style={styles.metricLabelDark}>Cortes registrados</div>
                  <div style={styles.metricValueDark}>
                    {Number(totals.total_cuts || 0).toLocaleString()}
                  </div>
                  <div style={styles.metricHintDark}>
                    {farms.length} huertas registradas
                  </div>
                </div>
              </div>

              <div style={styles.alertAndBestGrid}>
                <div style={styles.welcomeBox}>
                  <h2 style={{ marginBottom: "10px" }}>Resumen ejecutivo</h2>
                  <p>
                    {globalBestFarm
                      ? `La huerta con mayor producción es ${globalBestFarm.code || ""} ${globalBestFarm.name || ""}, con ${globalBestFarm.total_boxes.toLocaleString()} cajas.`
                      : "Aún no hay suficientes cortes registrados para generar ranking de producción."}
                  </p>
                  <p style={{ marginTop: "8px" }}>
                    {globalBestMonth
                      ? `El mejor mes por utilidad es ${globalBestMonth.label}, con $${globalBestMonth.utilidad.toLocaleString()}.`
                      : "Cuando agregues cortes y gastos, aquí aparecerá el mejor mes por utilidad."}
                  </p>
                </div>

                <div style={styles.bestMonthCard}>
                  <div style={styles.metricLabel}>Mejor huerta</div>
                  <div style={styles.bestMonthTitle}>
                    {globalBestFarm ? globalBestFarm.name : "SIN DATOS"}
                  </div>
                  <div style={styles.bestMonthValue}>
                    {globalBestFarm ? globalBestFarm.total_boxes.toLocaleString() : "0"} cajas
                  </div>
                  <div style={styles.metricHint}>ranking por producción</div>
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Cajas por mes</h2>
                    <span style={styles.chartBadge}>Global</span>
                  </div>

                  {globalMonthlyData.length === 0 ? (
                    <div style={styles.emptyChart}>Sin datos para graficar.</div>
                  ) : (
                    <div style={styles.rechartBox}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalMonthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="cajas" fill="#B88935" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Utilidad por mes</h2>
                    <span style={styles.chartBadge}>Global</span>
                  </div>

                  {globalMonthlyData.length === 0 ? (
                    <div style={styles.emptyChart}>Sin datos para graficar.</div>
                  ) : (
                    <div style={styles.rechartBox}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={globalMonthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="utilidad"
                            stroke="#111111"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#B88935" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Precio promedio por caja</h2>
                    <span style={styles.chartBadge}>Por mes</span>
                  </div>

                  {globalMonthlyAveragePriceData.length === 0 ? (
                    <div style={styles.emptyChart}>Sin datos para graficar.</div>
                  ) : (
                    <div style={styles.rechartBox}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={globalMonthlyAveragePriceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="precioPromedio"
                            stroke="#B88935"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#111111" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Cortes por mes</h2>
                    <span style={styles.chartBadge}>Actividad</span>
                  </div>

                  {globalMonthlyData.length === 0 ? (
                    <div style={styles.emptyChart}>Sin datos para graficar.</div>
                  ) : (
                    <div style={styles.rechartBox}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalMonthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="cortes" fill="#111111" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Ranking de huertas por cajas</h2>
                    <span style={styles.chartBadge}>Producción</span>
                  </div>

                  {globalFarmRanking.length === 0 ? (
                    <div style={styles.emptyChart}>Sin huertas con producción.</div>
                  ) : (
                    <div style={styles.rankingList}>
                      {globalFarmRanking.map((farm, index) => (
                        <div key={farm.id || index} style={styles.rankingRow}>
                          <div style={styles.rankingNumber}>{index + 1}</div>
                          <div style={styles.rankingInfo}>
                            <div style={styles.rankingTitle}>
                              {farm.code ? `${farm.code} ` : ""}{farm.name}
                            </div>
                            <div style={styles.rankingSubtitle}>
                              {farm.total_cuts} cortes · ${farm.total_income.toLocaleString()} ingresos
                            </div>
                          </div>
                          <div style={styles.rankingValue}>
                            {farm.total_boxes.toLocaleString()} cajas
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
<div style={styles.dashboardGrid}>
  <div style={styles.chartCard}>
    <div style={styles.chartHeader}>
      <h2 style={styles.chartTitle}>Empleados por área</h2>
      <span style={styles.chartBadge}>Personal</span>
    </div>

    <div style={styles.rankingList}>
      {(dashboardSummary.staffByArea || []).map((item, index) => (
        <div key={index} style={styles.rankingRow}>
          <div style={styles.rankingNumber}>{index + 1}</div>
          <div style={styles.rankingInfo}>
            <div style={styles.rankingTitle}>{item.area || "SIN ÁREA"}</div>
          </div>
          <div style={styles.rankingValue}>{item.total}</div>
        </div>
      ))}
    </div>
  </div>

  <div style={styles.chartCard}>
    <div style={styles.chartHeader}>
      <h2 style={styles.chartTitle}>Vehículos por función</h2>
      <span style={styles.chartBadge}>Inventario</span>
    </div>

    <div style={styles.rankingList}>
      {(dashboardSummary.assetsByFunction || []).map((item, index) => (
        <div key={index} style={styles.rankingRow}>
          <div style={styles.rankingNumber}>{index + 1}</div>
          <div style={styles.rankingInfo}>
            <div style={styles.rankingTitle}>{item.area || "SIN FUNCIÓN"}</div>
          </div>
          <div style={styles.rankingValue}>{item.total}</div>
        </div>
      ))}
    </div>
  </div>
</div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h2 style={styles.chartTitle}>Comparativo año contra año</h2>
                  <span style={styles.chartBadge}>Cajas por mes</span>
                </div>

                {globalYearComparisonData.length === 0 ? (
                  <div style={styles.emptyChart}>Sin datos para comparar años.</div>
                ) : (
                  <div style={styles.rechartBoxLarge}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={globalYearComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {globalYearsForComparison.map((year, index) => (
                          <Line
                            key={year}
                            type="monotone"
                            dataKey={year}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    if (currentView === "assetFiles" && selectedAsset) {
  const photos = assetFiles.filter((file) => file.file_type === "PHOTO");
  const pdfs = assetFiles.filter((file) => file.file_type === "PDF");

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Archivos de {selectedAsset.code}</h1>
          <div style={styles.subTitle}>
            {selectedAsset.brand || ""} {selectedAsset.model || ""}
          </div>
        </div>

        <button style={styles.cancelButton} onClick={() => setCurrentView("assets")}>
          Volver
        </button>
      </div>

      <div style={styles.formCard}>
        <div style={styles.uploadsBox}>
          <div style={styles.uploadSection}>
            <label style={styles.uploadLabel}>FOTOS</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAssetPhotoFilesChange(e.target.files)}
            />
            <div style={styles.fileList}>
              {assetPhotoFiles.length === 0
                ? "NO HAY FOTOS SELECCIONADAS"
                : assetPhotoFiles.map((file, index) => (
                    <div key={index}>{file.name}</div>
                  ))}
            </div>
          </div>

          <div style={styles.uploadSection}>
            <label style={styles.uploadLabel}>PDFS</label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => handleAssetPdfFilesChange(e.target.files)}
            />
            <div style={styles.fileList}>
              {assetPdfFiles.length === 0
                ? "NO HAY PDFS SELECCIONADOS"
                : assetPdfFiles.map((file, index) => (
                    <div key={index}>{file.name}</div>
                  ))}
            </div>
          </div>

          <button
            style={styles.saveButton}
            onClick={uploadAssetFiles}
            disabled={uploadingAssetFiles}
          >
            {uploadingAssetFiles ? "Subiendo..." : "Subir archivos"}
          </button>
        </div>
      </div>

      <div style={styles.detailFarmCard}>
        <h2>Fotos</h2>

        {photos.length === 0 ? (
          <p>No hay fotos cargadas.</p>
        ) : (
          <div style={styles.photoGrid}>
            {photos.map((file) => (
              <div key={file.id} style={styles.photoItem}>
                <a href={resolveFileUrl(file.file_url)} target="_blank" rel="noreferrer">
                  <img
                    src={resolveFileUrl(file.file_url)}
                    alt={file.file_name}
                    style={styles.farmPhoto}
                  />
                </a>

                <button
                  style={styles.smallDeleteButton}
                  onClick={() => handleDeleteAssetFile(file.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>PDFs</h2>

        {pdfs.length === 0 ? (
          <p>No hay PDFs cargados.</p>
        ) : (
          pdfs.map((file) => (
            <div key={file.id} style={styles.fileRowWithAction}>
              <a href={resolveFileUrl(file.file_url)} target="_blank" rel="noreferrer">
                {file.file_name}
              </a>

              <button
                style={styles.smallDeleteButton}
                onClick={() => handleDeleteAssetFile(file.id)}
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
    if (currentView === "assets") {
      return (
        <div>
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Vehículos / Inventario</h1>

            <div style={styles.headerActions}>
              <button style={styles.exportButton} onClick={handleExportExcel}>
                Exportar Excel
              </button>

              <button style={styles.refreshButton} onClick={() => fetchAssets()}>
                Recargar
              </button>
            </div>
          </div>

          <div style={styles.formCard}>
            <h2 style={styles.sectionTitle}>
              {editingAssetId ? "Editar vehículo" : "Nuevo vehículo"}
            </h2>

            <div style={styles.formGrid}>
              <select
                style={styles.input}
                value={assetForm.type}
                onChange={(e) => handleAssetInputChange("type", e.target.value)}
              >
                <option value="">TIPO</option>
                {TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                style={styles.input}
                value={assetForm.function}
                onChange={(e) =>
                  handleAssetInputChange("function", e.target.value)
                }
              >
                <option value="">FUNCIÓN</option>
                {FUNCTION_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                placeholder="NÚMERO CÓDIGO"
                value={assetForm.code_number}
                onChange={(e) =>
                  handleAssetInputChange("code_number", e.target.value)
                }
              />

              <input
                style={{
                  ...styles.input,
                  background: "#E2E8F0",
                  fontWeight: "bold"
                }}
                placeholder="CÓDIGO GENERADO"
                value={generatedCode}
                readOnly
              />

              <input
                style={styles.input}
                placeholder="MARCA"
                value={assetForm.brand}
                onChange={(e) => handleAssetInputChange("brand", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="MODELO"
                value={assetForm.model}
                onChange={(e) => handleAssetInputChange("model", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="AÑO"
                type="number"
                value={assetForm.year}
                onChange={(e) => handleAssetInputChange("year", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="RESPONSABLE"
                value={assetForm.responsible}
                onChange={(e) =>
                  handleAssetInputChange("responsible", e.target.value)
                }
              />

              <input
                style={styles.input}
                placeholder="NÚMERO ASIGNADO"
                value={assetForm.numero_asignado}
                onChange={(e) =>
                  handleAssetInputChange("numero_asignado", e.target.value)
                }
              />

              <input
                style={styles.input}
                placeholder="OBSERVACIÓN"
                value={assetForm.observation}
                onChange={(e) =>
                  handleAssetInputChange("observation", e.target.value)
                }
              />
            </div>

            <div style={styles.photoSection}>
              <label style={styles.photoLabel}>FOTO DEL VEHÍCULO</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
              />

              {photoPreview && (
                <div style={styles.previewWrapper}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                </div>
              )}
            </div>

            <div style={styles.formButtons}>
              <button
                style={styles.saveButton}
                onClick={handleSaveAsset}
                disabled={savingAsset}
              >
                {savingAsset
                  ? "Guardando..."
                  : editingAssetId
                  ? "Actualizar"
                  : "Crear"}
              </button>

              <button style={styles.cancelButton} onClick={resetAssetForm}>
                Limpiar
              </button>
            </div>
          </div>

          <div style={styles.searchCard}>
            <input
              style={styles.searchInput}
              placeholder="BUSCAR EN TIEMPO REAL..."
              value={assetSearch}
              onChange={(e) => setAssetSearch(toUpperValue(e.target.value))}
            />
          </div>

          {loadingAssets ? (
            <p>Cargando vehículos...</p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>CÓDIGO</th>
                    <th style={styles.th}>TIPO</th>
                    <th style={styles.th}>MARCA</th>
                    <th style={styles.th}>MODELO</th>
                    <th style={styles.th}>AÑO</th>
                    <th style={styles.th}>FUNCIÓN</th>
                    <th style={styles.th}>RESPONSABLE</th>
                    <th style={styles.th}>NÚMERO ASIGNADO</th>
                    <th style={styles.th}>OBSERVACIÓN</th>
                    <th style={styles.th}>ACCIONES</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan="10">
                        No hay registros
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.code}</td>
                        <td style={styles.td}>{item.type}</td>
                        <td style={styles.td}>{item.brand}</td>
                        <td style={styles.td}>{item.model}</td>
                        <td style={styles.td}>{item.year}</td>
                        <td style={styles.td}>{item.function}</td>
                        <td style={styles.td}>{item.responsible}</td>
                        <td style={styles.td}>{item.numero_asignado}</td>
                        <td style={styles.td}>{item.observation}</td>
                        <td style={styles.td}>
                          <div style={styles.actionsCell}>
                            <button
                              style={styles.viewButton}
                              onClick={() => setDetailAsset(item)}
                            >
                              Ver
                            </button>

                            <button
                              style={styles.viewButton}
                              onClick={() => openAssetFiles(item)}
                            >
                              Archivos
                            </button>

                            <button
                              style={styles.editButton}
                              onClick={() => handleEditAsset(item)}
                            >
                              Editar
                            </button>

                            <button
                              style={styles.deleteButton}
                              onClick={() => handleDeleteAsset(item.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {renderAssetDetail()}
        </div>
      );
    }

    if (currentView === "huertas") {
      return renderHuertasContent();
    }

    if (currentView === "finanzasHuertas") {
      return <FarmFinancePage />;
    }
    if (currentView === "airplanes") {
     return <AirplanesPage />;
    }

    if (currentView === "staff") {
      return renderStaffContent();
    }

return null;
  };

  if (token && user) {
    return (
      <div style={styles.layout} className="app-layout">
        <aside style={styles.sidebar} className="sidebar">
          <div style={styles.sidebarLogoBox}>
            <img src={bpLogo} alt="BP Group" style={styles.sidebarLogo} />
          </div>

        {(isAdmin || isFinanzas || isAgricola) && (
          <button
            style={
              currentView === "dashboard"
                ? styles.menuButtonActive
                : styles.menuButton
            }
            onClick={() => setCurrentView("dashboard")}
          >
            📊Dashboard
          </button>
        )}
          

          {canSeeAssets && (
          <button
            style={
              currentView === "assets"
                ? styles.menuButtonActive
                : styles.menuButton
            }
            onClick={() => setCurrentView("assets")}
          >
            🚗Vehículos
          </button>
          )}

          <button
            style={
              currentView === "huertas"
                ? styles.menuButtonActive
                : styles.menuButton
            }
            onClick={() => {
              setCurrentView("huertas");
              setHuertasView("list");
            }}
          >
            🌱Huertas
          </button>

          {canSeeMoney && (
            <button
            style={
              currentView === "finanzasHuertas"
                ? styles.menuButtonActive
                : styles.menuButton
              }
              onClick={() => setCurrentView("finanzasHuertas")}
            >
            💰Finanzas Huertas
          </button>
          )}

          {(isAdmin || isFinanzas || isViewer) && (
            <button
            style={
              currentView === "airplanes"
                ? styles.menuButtonActive
                : styles.menuButton
              }
              onClick={() => setCurrentView("airplanes")}
            >
            ✈️Aviones
          </button>
          )}

          {canSeeStaff && (
          <button
            style={
              currentView === "staff" ? styles.menuButtonActive : styles.menuButton
            }
            onClick={() => {
            setCurrentView("staff");
            setStaffView("areas");
          }}
          >
            👷Personal
          </button>
          )}

          <div style={{ flex: 1 }} />

          <button style={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </aside>

        <main style={styles.mainContent} className="main-content">
          {renderContent()}
        </main>
      </div>
    );
  }

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <img src={bpLogo} alt="BP Group" style={styles.loginLogo} />
        <h1 style={styles.loginTitle}>Iniciar sesión</h1>

        <input
          style={styles.input}
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.loginButton} onClick={handleLogin} disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}



const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(circle at top, #2A2115 0%, #111111 42%, #000000 100%)"
  },
  loginCard: {
    width: "390px",
    background: "rgba(10, 10, 10, 0.94)",
    padding: "38px",
    borderRadius: "20px",
    border: "1px solid #B88935",
    boxShadow: "0 28px 70px rgba(0,0,0,0.58)",
    textAlign: "center"
  },
  loginTitle: {
    color: "#F7E7BE",
    marginBottom: "24px",
    fontSize: "26px",
    letterSpacing: "0.5px"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    outline: "none",
    boxSizing: "border-box"
  },
  loginButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #B88935, #F1D08A)",
    color: "#111111",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(184,137,53,0.25)"
  },
  layout: {
    minHeight: "100vh",
    display: "flex",
    background: "#F7F3EA"
  },
  sidebar: {
    width: "270px",
    background: "linear-gradient(180deg, #111111 0%, #050505 100%)",
    color: "white",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderRight: "1px solid #B88935",
    boxShadow: "10px 0 35px rgba(0,0,0,0.18)"
  },

  loginLogo: {
    width: "210px",
    maxHeight: "130px",
    objectFit: "contain",
    marginBottom: "18px"
  },
  sidebarLogoBox: {
    textAlign: "center",
    marginBottom: "22px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(184,137,53,0.35)"
  },
  sidebarLogo: {
    width: "180px",
    maxHeight: "120px",
    objectFit: "contain"
  },
  logo: {
    marginBottom: "10px"
  },
  menuButton: {
    background: "transparent",
    color: "#E8E1D4",
    border: "1px solid transparent",
    padding: "13px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: "600"
  },
  menuButtonActive: {
    background: "linear-gradient(135deg, #B88935, #E6C06D)",
    color: "#111111",
    border: "none",
    padding: "13px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 8px 20px rgba(184,137,53,0.25)"
  },
  logoutButton: {
    background: "transparent",
    color: "#E6C06D",
    border: "1px solid #B88935",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  mainContent: {
    flex: 1,
    padding: "32px",
    background: "#F7F3EA",
    overflowX: "auto"
  },
  pageTitle: {
    margin: 0,
    fontSize: "clamp(28px, 6vw, 42px)",
    fontWeight: 900,
    letterSpacing: "-1px",
    wordBreak: "break-word"
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "wrap"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px"
  },
  infoCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  infoCardTitle: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "8px"
  },
  infoCardValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#0f172a"
  },
  welcomeBox: {
    background: "linear-gradient(135deg, #111111, #24201A)",
    color: "#F8F5EF",
    borderRadius: "18px",
    padding: "28px",
    border: "1px solid #B88935",
    boxShadow: "0 14px 40px rgba(17,17,17,0.22)"
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap"
  },
  refreshButton: {
    background: "#2B2B2B",
    color: "#F8F5EF",
    border: "1px solid #B88935",
    padding: "10px 14px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  exportButton: {
    background: "#111111",
    color: "#E6C06D",
    border: "1px solid #B88935",
    padding: "10px 14px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  formCard: {
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #E7D8B2",
    boxShadow: "0 10px 28px rgba(17,17,17,0.08)",
    marginBottom: "20px"
  },
  sectionTitle: {
    marginBottom: "16px",
    color: "#0f172a"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px"
  },
  formGridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px"
  },
  photoSection: {
    marginTop: "16px"
  },
  photoLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#0f172a"
  },
  previewWrapper: {
    marginTop: "12px"
  },
  previewImage: {
    width: "180px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid #CBD5E1"
  },
  formButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "16px"
  },
  saveButton: {
    background: "linear-gradient(135deg, #B88935, #E6C06D)",
    color: "#111111",
    border: "none",
    padding: "12px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  cancelButton: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "12px 16px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  searchCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "20px"
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    outline: "none",
    boxSizing: "border-box"
  },
  tableContainer: {
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #E7D8B2",
    boxShadow: "0 10px 28px rgba(17,17,17,0.08)",
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #D8C08A",
    background: "#151515",
    color: "#E6C06D"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    verticalAlign: "top"
  },
  actionsCell: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  viewButton: {
    background: "#0ea5e9",
    color: "white",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  editButton: {
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  deleteButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  placeholderBox: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  huertasListBox: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  huertaRowWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px"
  },
  huertaRow: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    padding: "14px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left"
  },
  huertaCode: {
    fontWeight: "bold",
    color: "#2563EB",
    minWidth: "90px"
  },
  huertaName: {
    fontWeight: "bold",
    color: "#0F172A"
  },
  huertaDeleteButton: {
    background: "#DC2626",
    color: "white",
    border: "none",
    padding: "12px 16px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  detailFarmCard: {
    background: "#ffffff",
    borderRadius: 22,
    padding: 28,
    marginTop: 24,
    boxShadow: "0 14px 35px rgba(0,0,0,0.08)",
    overflow: "hidden",
    maxWidth: "100%",
    boxSizing: "border-box"
  },
  detailFarmGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 24,
    fontSize: 18,
    lineHeight: 1.35,
    maxWidth: "100%"
  },
  detailFarmGridMobile: {
    display: "grid",
    gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: window.innerWidth <= 768 ? 18 : 24,
    fontSize: window.innerWidth <= 768 ? 16 : 18,
    lineHeight: 1.45,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    wordBreak: "break-word"
  },

  uploadsBox: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "16px",
    alignItems: "end"
  },
  uploadSection: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "16px"
  },
  uploadLabel: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#0f172a"
  },
  fileList: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#334155"
  },
  filesSection: {
    marginTop: "26px",
    borderTop: "1px solid #CBD5E1",
    paddingTop: "20px"
  },
  fileRow: {
    padding: "8px 0"
  },
  fileRowWithAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0",
    borderBottom: "1px solid #E2E8F0"
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px"
  },
  photoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  farmPhoto: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid #CBD5E1"
  },
  smallDeleteButton: {
    background: "#DC2626",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px"
  },
  subTitle: {
    marginTop: "-12px",
    color: "#6B5B3E",
    fontWeight: "700",
    fontSize: "13px"
  },
  cutLayout: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "18px",
    alignItems: "start"
  },
  cutSidebar: {
    background: "#111111",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #B88935",
    boxShadow: "0 10px 28px rgba(17,17,17,0.18)",
    position: "sticky",
    top: "20px"
  },
  cutMain: { minWidth: 0 },
  filterTitle: { color: "#E6C06D", fontWeight: "800", marginBottom: "14px", letterSpacing: "0.5px" },
  cutFilterButton: { width: "100%", background: "transparent", color: "#F8F5EF", border: "1px solid rgba(184,137,53,0.45)", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left", fontWeight: "700", marginBottom: "8px" },
  cutFilterActive: { width: "100%", background: "linear-gradient(135deg, #B88935, #E6C06D)", color: "#111111", border: "none", padding: "10px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left", fontWeight: "900", marginBottom: "8px" },
  yearBlock: { marginBottom: "10px" },
  monthList: { display: "flex", flexDirection: "column", gap: "6px", marginLeft: "12px", marginBottom: "10px" },
  monthButton: { background: "rgba(255,255,255,0.05)", color: "#E8E1D4", border: "1px solid rgba(255,255,255,0.08)", padding: "7px 9px", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "12px" },
  monthButtonActive: { background: "#F1D08A", color: "#111111", border: "none", padding: "7px 9px", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "12px", fontWeight: "800" },
  emptyText: { color: "#D8C08A", fontSize: "13px", padding: "10px 0" },
  proCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "18px"
  },  
  metricCardDark: { background: "linear-gradient(135deg, #111111, #2A251C)", border: "1px solid #B88935", borderRadius: "18px", padding: "20px", boxShadow: "0 10px 28px rgba(17,17,17,0.18)" },
  metricCardGold: { background: "linear-gradient(135deg, #B88935, #F1D08A)", borderRadius: "18px", padding: "20px", boxShadow: "0 10px 28px rgba(184,137,53,0.22)" },
  metricCardWhite: { background: "#FFFFFF", border: "1px solid #E7D8B2", borderRadius: "18px", padding: "20px", boxShadow: "0 10px 28px rgba(17,17,17,0.08)" },
  metricLabel: { color: "#E6C06D", fontSize: "13px", fontWeight: "800", marginBottom: "8px" },
  metricLabelDark: { color: "#4A3514", fontSize: "13px", fontWeight: "800", marginBottom: "8px" },
  metricValue: { color: "#FFFFFF", fontSize: "28px", fontWeight: "900" },
  metricValueDark: { color: "#111111", fontSize: "28px", fontWeight: "900" },
  metricHint: { color: "#D8C08A", fontSize: "12px", marginTop: "6px" },
  metricHintDark: { color: "#5F4A22", fontSize: "12px", marginTop: "6px", fontWeight: "700" },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
    marginBottom: "18px"
  },
  chartCard: { background: "#FFFFFF", border: "1px solid #E7D8B2", borderRadius: "18px", padding: "20px", boxShadow: "0 10px 28px rgba(17,17,17,0.08)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  chartTitle: { margin: 0, color: "#111111", fontSize: "20px", fontWeight: "900" },
  chartBadge: { background: "#111111", color: "#E6C06D", border: "1px solid #B88935", padding: "5px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "800" },
  barChart: { display: "flex", flexDirection: "column", gap: "12px" },
  barRow: { display: "grid", gridTemplateColumns: "120px 1fr 110px", gap: "10px", alignItems: "center" },
  barLabel: { fontSize: "12px", fontWeight: "800", color: "#334155" },
  barTrack: { height: "14px", background: "#EFE7D5", borderRadius: "999px", overflow: "hidden" },
  barFillGold: { height: "100%", background: "linear-gradient(135deg, #B88935, #F1D08A)", borderRadius: "999px" },
  barFillDark: { height: "100%", background: "linear-gradient(135deg, #111111, #B88935)", borderRadius: "999px" },
  barValue: { fontSize: "12px", fontWeight: "800", color: "#111111", textAlign: "right" },
  emptyChart: { padding: "24px", color: "#64748B", background: "#F8FAFC", borderRadius: "12px" },
  alertAndBestGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "18px", marginBottom: "18px" },
  alertCard: { background: "#FFFFFF", border: "1px solid #E7D8B2", borderRadius: "18px", padding: "20px", boxShadow: "0 10px 28px rgba(17,17,17,0.08)" },
  alertList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" },
  alertItem: { display: "flex", gap: "12px", alignItems: "flex-start", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px" },
  alertIcon: { width: "28px", height: "28px", borderRadius: "50%", background: "#111111", color: "#E6C06D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900" },
  alertTitle: { fontWeight: "900", color: "#111111", marginBottom: "3px" },
  alertMessage: { color: "#64748B", fontSize: "13px" },
  bestMonthCard: { background: "linear-gradient(135deg, #111111, #2A251C)", border: "1px solid #B88935", borderRadius: "18px", padding: "22px", boxShadow: "0 10px 28px rgba(17,17,17,0.18)", display: "flex", flexDirection: "column", justifyContent: "center" },
  bestMonthTitle: { color: "#FFFFFF", fontSize: "22px", fontWeight: "900", marginBottom: "10px" },
  bestMonthValue: { color: "#E6C06D", fontSize: "28px", fontWeight: "900" },

  cutTableContainer: {
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "12px",
    border: "1px solid #E7D8B2",
    boxShadow: "0 10px 28px rgba(17,17,17,0.08)",
    width: "100%",
    overflowX: "visible"
  },
  cutsTable: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed"
  },
  cutTh: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "1px solid #D8C08A",
    background: "#151515",
    color: "#E6C06D",
    fontSize: "12px",
    lineHeight: "1.15",
    wordBreak: "break-word"
  },
  cutTd: {
    padding: "10px 8px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    verticalAlign: "top",
    fontSize: "12px",
    lineHeight: "1.25",
    wordBreak: "break-word",
    whiteSpace: "normal"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px"
  },
  modalCard: {
    width: "900px",
    maxWidth: "100%",
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  closeButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer"
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px"
  },
  detailLeft: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  detailRight: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  detailImage: {
    width: "100%",
    maxWidth: "300px",
    height: "220px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #CBD5E1"
  },
  noImageBox: {
    width: "300px",
    height: "220px",
    borderRadius: "12px",
    border: "1px dashed #94A3B8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748B",
    fontWeight: "bold"
  },
  detailItem: {
    fontSize: "16px",
    color: "#0f172a"
  },
  dashboardSubtitle: {
    marginTop: "-12px",
    color: "#64748B",
    fontSize: "14px"
  },
  rechartBox: {
    width: "100%",
    height: "320px"
  },
  rankingList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  rankingRow: {
    display: "grid",
    gridTemplateColumns: "42px 1fr 150px",
    gap: "12px",
    alignItems: "center",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "12px"
  },
  rankingNumber: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B88935, #F1D08A)",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  rankingInfo: {
    minWidth: 0
  },
  rankingTitle: {
    color: "#111111",
    fontWeight: "900"
  },
  rankingSubtitle: {
    color: "#64748B",
    fontSize: "12px",
    marginTop: "3px"
  },
  rankingValue: {
    textAlign: "right",
    color: "#4A3514",
    fontWeight: "900"
  },
  huertasGridPremium: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 18,
  marginTop: 22,
  alignItems: "stretch"
},

huertaCardPremium: {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  background: "#ffffff",
  border: "1px solid #e6d8bd",
  borderRadius: 22,
  padding: 14,
  boxShadow: "0 14px 30px rgba(0,0,0,0.07)",
  minHeight: 190,
  boxSizing: "border-box"
},

huertaCardMain: {
  width: "100%",
  minHeight: 160,
  display: "grid",
  gridTemplateColumns: "56px 1fr auto",
  alignItems: "center",
  gap: 16,
  border: "none",
  background: "linear-gradient(135deg, #fffaf0, #f6f1e8)",
  borderRadius: 18,
  padding: 18,
  cursor: "pointer",
  textAlign: "left",
  boxSizing: "border-box"
},

huertaIcon: {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#111",
  fontSize: 26,
  boxShadow: "0 10px 22px rgba(0,0,0,0.16)",
  flexShrink: 0
},

huertaInfo: {
  minWidth: 0,
  overflow: "hidden"
},

huertaCodePremium: {
  fontSize: 13,
  fontWeight: 900,
  color: "#b88935",
  letterSpacing: 1,
  marginBottom: 4
},

huertaNamePremium: {
  fontSize: 20,
  fontWeight: 900,
  color: "#111",
  lineHeight: 1.15,
  whiteSpace: "normal",
  overflowWrap: "break-word",
  wordBreak: "normal"
},


huertaMetaPremium: {
  fontSize: 13,
  color: "#6b6258",
  marginTop: 8,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
},

huertaArrow: {
  fontWeight: 900,
  color: "#111",
  whiteSpace: "nowrap",
  fontSize: 14
},

huertaDeleteButtonPremium: {
  width: 92,
  minHeight: 160,
  border: "none",
  borderRadius: 18,
  background: "#d92525",
  color: "#fff",
  fontWeight: 900,
  padding: "0 14px",
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(217,37,37,0.18)"
},
emptyState: {
  background: "#fff",
  border: "1px solid #e6d8bd",
  borderRadius: 20,
  padding: 28,
  fontWeight: 800,
  color: "#6b6258"
}

  
};

export default App;