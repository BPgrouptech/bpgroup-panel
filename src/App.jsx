import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import bpLogo from "./assets/bp-logo.png";

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
  "ROJO",
  "AZUL",
  "VERDE",
  "AMARILLO",
  "MORADO",
  "NARANJA",
  "BLANCO",
  "NEGRO",
  "ROSADO",
  "CAFÉ",
  "GRIS"
];

const MONTH_NAMES = {
  1: "ENERO",
  2: "FEBRERO",
  3: "MARZO",
  4: "ABRIL",
  5: "MAYO",
  6: "JUNIO",
  7: "JULIO",
  8: "AGOSTO",
  9: "SEPTIEMBRE",
  10: "OCTUBRE",
  11: "NOVIEMBRE",
  12: "DICIEMBRE"
};

const CHART_COLORS = [
  "#B88935",
  "#111111",
  "#E6C06D",
  "#64748B",
  "#16A34A",
  "#DC2626",
  "#0EA5E9",
  "#A855F7",
  "#F97316",
  "#14B8A6"
];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [detailAsset, setDetailAsset] = useState(null);

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
      avg_price: 0,
      pending_finance: 0
    },
    byMonth: [],
    byFarm: []
  });

  const [loadingGlobalDashboard, setLoadingGlobalDashboard] = useState(false);

  const isAdmin = user?.role === "admin";
  const isAgricola = user?.role === "agricola";
  const isFinanzas = user?.role === "finanzas";
  const isInventario = user?.role === "inventario";
  const isViewer = user?.role === "viewer";

  const canSeeMoney = isAdmin || isFinanzas;
  const canAddCuts = isAdmin || isAgricola;
  const canManageFarms = isAdmin;
  const canManageAssets = isAdmin || isInventario;
  const canSeeAssets = isAdmin || isInventario || isViewer;
  const canSeeHuertas = isAdmin || isAgricola || isFinanzas || isViewer;
  const canSeeDashboard = isAdmin || isFinanzas;

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
    if (token && currentView === "assets" && canSeeAssets) {
      fetchAssets(token);
    }
  }, [token, currentView, canSeeAssets]);

  useEffect(() => {
    if (token && currentView === "huertas" && canSeeHuertas) {
      fetchFarms(token);
    }
  }, [token, currentView, canSeeHuertas]);

  useEffect(() => {
    if (token && currentView === "dashboard" && canSeeDashboard) {
      fetchGlobalDashboard(token);
      fetchFarms(token);
    }
  }, [token, currentView, canSeeDashboard]);

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

  const toUpperValue = (value) => String(value || "").toUpperCase();

  const resolveFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    return `${API_URL}${fileUrl}`;
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

      if (data.role === "agricola") setCurrentView("huertas");
      if (data.role === "inventario") setCurrentView("assets");
      if (data.role === "viewer") setCurrentView("huertas");
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
        setCurrentView("huertas");
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

  const fetchGlobalDashboard = async (currentToken = token) => {
    try {
      if (!canSeeDashboard) return;

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
          avg_price: 0,
          pending_finance: 0
        },
        byMonth: data.byMonth || [],
        byFarm: data.byFarm || []
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
      if (!canManageAssets) {
        alert("No tienes permiso para guardar vehículos");
        return;
      }

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
    if (!canManageAssets) return;

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
      if (!isAdmin) {
        alert("Solo admin puede eliminar vehículos");
        return;
      }

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

    if (selected.length > 5) {
      alert("SOLO PUEDES SELECCIONAR MÁXIMO 5 PDFS");
      return;
    }

    const invalid = selected.some((file) => file.type !== "application/pdf");

    if (invalid) {
      alert("SOLO SE PERMITEN ARCHIVOS PDF");
      return;
    }

    setFarmPdfFiles(selected);
  };

  const handleFarmPhotoFilesChange = (files) => {
    const selected = Array.from(files || []);

    if (selected.length > 5) {
      alert("SOLO PUEDES SELECCIONAR MÁXIMO 5 FOTOS");
      return;
    }

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
      if (!canManageFarms) {
        alert("Solo admin puede guardar huertas");
        return;
      }

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
      if (!isAdmin) {
        alert("Solo admin puede eliminar huertas");
        return;
      }

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

      if (!isAdmin) {
        alert("Solo admin puede subir archivos");
        return;
      }

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

      if (!isAdmin) {
        alert("Solo admin puede eliminar archivos");
        return;
      }

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
  };

  const handleCutInputChange = (field, value) => {
    if (
      field === "boxes_produced" ||
      field === "price_per_box" ||
      field === "cut_date"
    ) {
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
    return date
      .toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
      .toUpperCase();
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

      const url = `${API_URL}/farms/${farmId}/cuts${
        params.toString() ? `?${params.toString()}` : ""
      }`;

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

      if (!canAddCuts) {
        alert("No tienes permiso para agregar cortes");
        return;
      }

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

      if (canSeeMoney) {
        payload.price_per_box = Number(cutForm.price_per_box || 0);
      }

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

      if (!isAdmin) {
        alert("Solo admin puede eliminar cortes");
        return;
      }

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
    const years = [
      ...new Set(farmCutsSummary.map((item) => Number(item.cut_year)))
    ];
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

  const averagePricePerBox =
    totalCutsBoxes > 0 ? totalCutsIncome / totalCutsBoxes : 0;

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

    if (canSeeMoney) {
      return [...monthlyCutsDashboard].sort((a, b) => b.income - a.income)[0];
    }

    return [...monthlyCutsDashboard].sort((a, b) => b.boxes - a.boxes)[0];
  }, [monthlyCutsDashboard, canSeeMoney]);

  const nextCutAlerts = useMemo(() => {
    const latestByColor = {};

    allFarmCuts.forEach((cut) => {
      if (!cut.color || !cut.cut_date) return;

      const color = String(cut.color).toUpperCase();
      const cutDate = new Date(`${String(cut.cut_date).slice(0, 10)}T00:00:00`);

      if (!latestByColor[color] || cutDate > latestByColor[color].lastDate) {
        latestByColor[color] = {
          color,
          lastDate: cutDate,
          cut
        };
      }
    });

    return Object.values(latestByColor)
      .map((item) => {
        const nextDate = addDaysToDate(item.cut.cut_date, 56);
        const diffDays = getDaysDifference(nextDate);

        return {
          color: item.color,
          lastDate: item.lastDate,
          nextDate,
          diffDays
        };
      })
      .filter((item) => item.diffDays <= 7)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [allFarmCuts]);

  const productionAlerts = useMemo(() => {
    const alerts = [];

    nextCutAlerts.forEach((item) => {
      let timingText = "";

      if (item.diffDays < 0) {
        timingText = `está atrasado por ${Math.abs(item.diffDays)} día(s)`;
      } else if (item.diffDays === 0) {
        timingText = "debe cortarse hoy";
      } else {
        timingText = `falta(n) ${item.diffDays} día(s)`;
      }

      alerts.push({
        type: item.diffDays < 0 ? "danger" : "warning",
        title: `Próximo corte color ${item.color}`,
        message: `El siguiente corte corresponde el ${formatCutDate(
          item.nextDate
        )}; ${timingText}. Último corte: ${formatCutDate(item.lastDate)}.`
      });
    });

    if (farmCuts.length === 0) {
      alerts.push({
        type: "danger",
        title: "Sin cortes registrados",
        message: "No hay cortes en el filtro seleccionado."
      });
      return alerts;
    }

    if (canSeeMoney && averagePricePerBox > 0 && averagePricePerBox < 5) {
      alerts.push({
        type: "warning",
        title: "Precio promedio bajo",
        message: `El precio promedio por caja está en $${averagePricePerBox.toFixed(
          2
        )}.`
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
      (cut) =>
        Number(cut.cut_year) === currentYear &&
        Number(cut.cut_month) === currentMonth
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
  }, [
    farmCuts,
    allFarmCuts,
    monthlyCutsDashboard,
    averagePricePerBox,
    cutsFilter,
    nextCutAlerts,
    canSeeMoney
  ]);

  const exportFarmCutsExcel = () => {
    if (!selectedFarm) return;

    const rows = farmCuts.map((cut) => {
      const base = {
        HUERTA: selectedFarm.name || "",
        CODIGO_HUERTA: selectedFarm.code || "",
        FECHA_CORTE: String(cut.cut_date || "").slice(0, 10),
        AÑO: cut.cut_year || "",
        MES: MONTH_NAMES[Number(cut.cut_month)] || cut.cut_month || "",
        COLOR: cut.color || "",
        CAJAS_PRODUCIDAS: Number(cut.boxes_produced || 0),
        EMPRESA_COMPRADORA: cut.buyer_company || "",
        DISEÑO_CAJA: cut.box_design || "",
        OBSERVACION: cut.observation || "",
        ESTADO: cut.status || ""
      };

      if (canSeeMoney) {
        base.PRECIO_POR_CAJA = Number(cut.price_per_box || 0);
        base.INGRESO_BRUTO = Number(cut.gross_income || 0);
      }

      return base;
    });

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
    if (!canManageFarms) return;

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

  const openHuertasGraphs = () => {
    setHuertasView("graphs");
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
      label: `${MONTH_NAMES[Number(item.cut_month)] || item.cut_month} ${
        item.cut_year
      }`,
      cajas: Number(item.total_boxes || 0),
      ingresos: Number(item.total_income || 0),
      cortes: Number(item.total_cuts || 0)
    }));
  }, [globalDashboard.byMonth]);

  const globalFarmRanking = useMemo(() => {
    return [...(globalDashboard.byFarm || [])]
      .map((item) => ({
        ...item,
        total_boxes: Number(item.total_boxes || 0),
        total_income: Number(item.total_income || 0),
        total_cuts: Number(item.total_cuts || 0),
        pending_finance: Number(item.pending_finance || 0)
      }))
      .sort((a, b) => b.total_boxes - a.total_boxes)
      .slice(0, 8);
  }, [globalDashboard.byFarm]);

  const globalBestFarm =
    globalFarmRanking.length > 0 ? globalFarmRanking[0] : null;

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
      precioPromedio:
        item.cajas > 0 ? Number((item.ingresos / item.cajas).toFixed(2)) : 0
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
    return [
      ...new Set((globalDashboard.byMonth || []).map((item) => String(item.cut_year)))
    ].sort((a, b) => Number(a) - Number(b));
  }, [globalDashboard.byMonth]);

  const exportGlobalDashboardExcel = () => {
    if (!canSeeMoney) return;

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          TOTAL_CORTES: Number(globalDashboard.totals?.total_cuts || 0),
          TOTAL_CAJAS: Number(globalDashboard.totals?.total_boxes || 0),
          TOTAL_INGRESOS: Number(globalDashboard.totals?.total_income || 0),
          PRECIO_PROMEDIO: Number(globalDashboard.totals?.avg_price || 0),
          PENDIENTES_FINANZAS: Number(
            globalDashboard.totals?.pending_finance || 0
          ),
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
  }};
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
            {Object.keys(emptyFarmForm).map((field) => (
              <input
                key={field}
                style={styles.input}
                placeholder={field.replaceAll("_", " ").toUpperCase()}
                value={farmForm[field]}
                onChange={(e) => handleFarmInputChange(field, e.target.value)}
              />
            ))}
          </div>

          <div style={styles.uploadsBox}>
            <div style={styles.uploadSection}>
              <label style={styles.uploadLabel}>PDFS (MÁXIMO 5)</label>
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
              <label style={styles.uploadLabel}>FOTOS (MÁXIMO 5)</label>
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
            <button
              style={styles.cancelButton}
              onClick={() => setHuertasView("detail")}
            >
              Volver al resumen
            </button>
          </div>
        </div>

        <div style={styles.formCard}>
          {isAgricola && (
            <div style={styles.infoNotice}>
              Este corte quedará pendiente para que Finanzas complete el precio
              por caja.
            </div>
          )}

          <div style={styles.formGridThree}>
            <input
              style={styles.input}
              type="date"
              value={cutForm.cut_date}
              onChange={(e) => handleCutInputChange("cut_date", e.target.value)}
            />

            <select
              style={styles.input}
              value={cutForm.color}
              onChange={(e) => handleCutInputChange("color", e.target.value)}
            >
              <option value="">COLOR</option>
              {CUT_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="CAJAS PRODUCIDAS"
              value={cutForm.boxes_produced}
              onChange={(e) =>
                handleCutInputChange("boxes_produced", e.target.value)
              }
            />

            {canSeeMoney && (
              <>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="PRECIO POR CAJA"
                  value={cutForm.price_per_box}
                  onChange={(e) =>
                    handleCutInputChange("price_per_box", e.target.value)
                  }
                />

                <input
                  style={{
                    ...styles.input,
                    background: "#EFE7D5",
                    fontWeight: "bold"
                  }}
                  value={`INGRESO BRUTO: $${calculatedGrossIncome.toFixed(2)}`}
                  readOnly
                />
              </>
            )}

            <input
              style={styles.input}
              placeholder="EMPRESA COMPRADORA"
              value={cutForm.buyer_company}
              onChange={(e) =>
                handleCutInputChange("buyer_company", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="DISEÑO DE CAJA"
              value={cutForm.box_design}
              onChange={(e) =>
                handleCutInputChange("box_design", e.target.value)
              }
            />

            <input
              style={styles.input}
              placeholder="OBSERVACIÓN"
              value={cutForm.observation}
              onChange={(e) =>
                handleCutInputChange("observation", e.target.value)
              }
            />
          </div>

          <div style={styles.formButtons}>
            <button
              style={styles.saveButton}
              onClick={handleSaveCut}
              disabled={savingCut}
            >
              {savingCut ? "Guardando..." : "Guardar corte"}
            </button>

            <button
              style={styles.cancelButton}
              onClick={() => setHuertasView("detail")}
            >
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
    const maxBoxes = Math.max(
      ...monthlyCutsDashboard.map((item) => item.boxes),
      1
    );
    const maxIncome = Math.max(
      ...monthlyCutsDashboard.map((item) => item.income),
      1
    );

    const filterTitle = cutsFilter.year
      ? cutsFilter.month
        ? `${MONTH_NAMES[cutsFilter.month]} ${cutsFilter.year}`
        : `AÑO ${cutsFilter.year}`
      : "TODO EL TIEMPO";

    return (
      <div>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>
              Dashboard de Cortes - {selectedFarm.name}
            </h1>
            <div style={styles.subTitle}>Filtro activo: {filterTitle}</div>
          </div>

          <div style={styles.headerActions}>
            {canAddCuts && (
              <button style={styles.saveButton} onClick={openAddCut}>
                Agregar corte
              </button>
            )}

            <button style={styles.exportButton} onClick={exportFarmCutsExcel}>
              Exportar Excel
            </button>

            <button
              style={styles.cancelButton}
              onClick={() => setHuertasView("detail")}
            >
              Volver al resumen
            </button>
          </div>
        </div>

        <div style={styles.cutLayout}>
          <div style={styles.cutSidebar}>
            <div style={styles.filterTitle}>Filtros</div>

            <button
              style={
                !cutsFilter.year && !cutsFilter.month
                  ? styles.cutFilterActive
                  : styles.cutFilterButton
              }
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
                    style={
                      cutsFilter.year === year && !cutsFilter.month
                        ? styles.cutFilterActive
                        : styles.cutFilterButton
                    }
                    onClick={() => applyCutsFilter(year, null)}
                  >
                    {year}
                  </button>

                  <div style={styles.monthList}>
                    {getMonthsForYear(year).map((month) => (
                      <button
                        key={`${year}-${month}`}
                        style={
                          cutsFilter.year === year &&
                          cutsFilter.month === month
                            ? styles.monthButtonActive
                            : styles.monthButton
                        }
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
            <div
              style={{
                ...styles.proCardsGrid,
                gridTemplateColumns: canSeeMoney
                  ? "repeat(4, 1fr)"
                  : "repeat(2, 1fr)"
              }}
            >
              <div style={styles.metricCardDark}>
                <div style={styles.metricLabel}>Cortes mostrados</div>
                <div style={styles.metricValue}>{farmCuts.length}</div>
                <div style={styles.metricHint}>registros</div>
              </div>

              <div style={styles.metricCardGold}>
                <div style={styles.metricLabelDark}>Total cajas</div>
                <div style={styles.metricValueDark}>
                  {totalCutsBoxes.toLocaleString()}
                </div>
                <div style={styles.metricHintDark}>cajas producidas</div>
              </div>

              {canSeeMoney && (
                <>
                  <div style={styles.metricCardDark}>
                    <div style={styles.metricLabel}>Ingreso bruto</div>
                    <div style={styles.metricValue}>
                      ${totalCutsIncome.toLocaleString()}
                    </div>
                    <div style={styles.metricHint}>total del filtro</div>
                  </div>

                  <div style={styles.metricCardWhite}>
                    <div style={styles.metricLabelDark}>Precio promedio</div>
                    <div style={styles.metricValueDark}>
                      ${averagePricePerBox.toFixed(2)}
                    </div>
                    <div style={styles.metricHintDark}>por caja</div>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                ...styles.dashboardGrid,
                gridTemplateColumns: canSeeMoney ? "1fr 1fr" : "1fr"
              }}
            >
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
                              width: `${Math.max(
                                (item.boxes / maxBoxes) * 100,
                                4
                              )}%`
                            }}
                          />
                        </div>
                        <div style={styles.barValue}>
                          {item.boxes.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canSeeMoney && (
                <div style={styles.chartCard}>
                  <div style={styles.chartHeader}>
                    <h2 style={styles.chartTitle}>Ingresos por mes</h2>
                    <span style={styles.chartBadge}>Dinero</span>
                  </div>

                  {monthlyCutsDashboard.length === 0 ? (
                    <div style={styles.emptyChart}>
                      Sin datos para graficar.
                    </div>
                  ) : (
                    <div style={styles.barChart}>
                      {monthlyCutsDashboard.map((item) => (
                        <div key={`income-${item.key}`} style={styles.barRow}>
                          <div style={styles.barLabel}>{item.label}</div>
                          <div style={styles.barTrack}>
                            <div
                              style={{
                                ...styles.barFillDark,
                                width: `${Math.max(
                                  (item.income / maxIncome) * 100,
                                  4
                                )}%`
                              }}
                            />
                          </div>
                          <div style={styles.barValue}>
                            ${item.income.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.alertAndBestGrid}>
              <div style={styles.alertCard}>
                <h2 style={styles.chartTitle}>Alertas de producción</h2>
                <div style={styles.alertList}>
                  {productionAlerts.map((alert, index) => (
                    <div key={index} style={styles.alertItem}>
                      <div style={styles.alertIcon}>
                        {alert.type === "success"
                          ? "✓"
                          : alert.type === "danger"
                          ? "!"
                          : "⚠"}
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
                <div style={styles.metricLabel}>
                  {canSeeMoney ? "Mejor mes" : "Mes con más cajas"}
                </div>
                <div style={styles.bestMonthTitle}>
                  {bestMonth ? bestMonth.label : "SIN DATOS"}
                </div>
                <div style={styles.bestMonthValue}>
                  {bestMonth
                    ? canSeeMoney
                      ? `$${bestMonth.income.toLocaleString()}`
                      : `${bestMonth.boxes.toLocaleString()} cajas`
                    : canSeeMoney
                    ? "$0"
                    : "0 cajas"}
                </div>
                <div style={styles.metricHint}>
                  {canSeeMoney
                    ? "Ingreso bruto más alto"
                    : "Producción más alta"}
                </div>
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
                      <th style={styles.cutTh}>ESTADO</th>
                      <th style={styles.cutTh}>OBSERVACIÓN</th>
                      {isAdmin && <th style={styles.cutTh}>ACCIONES</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {farmCuts.map((cut) => (
                      <tr key={cut.id}>
                        <td style={styles.cutTd}>
                          {String(cut.cut_date || "").slice(0, 10)}
                        </td>
                        <td style={styles.cutTd}>{cut.color || "-"}</td>
                        <td style={styles.cutTd}>
                          {Number(cut.boxes_produced || 0).toLocaleString()}
                        </td>
                        {canSeeMoney && (
                          <td style={styles.cutTd}>
                            ${Number(cut.price_per_box || 0).toFixed(2)}
                          </td>
                        )}
                        <td style={styles.cutTd}>
                          {cut.buyer_company || "-"}
                        </td>
                        <td style={styles.cutTd}>{cut.box_design || "-"}</td>
                        {canSeeMoney && (
                          <td style={styles.cutTd}>
                            ${Number(cut.gross_income || 0).toLocaleString()}
                          </td>
                        )}
                        <td style={styles.cutTd}>{cut.status || "-"}</td>
                        <td style={styles.cutTd}>{cut.observation || "-"}</td>
                        {isAdmin && (
                          <td style={styles.cutTd}>
                            <button
                              style={styles.smallDeleteButton}
                              onClick={() => handleDeleteCut(cut.id)}
                            >
                              Eliminar
                            </button>
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

          <div style={styles.placeholderBox}>
            Aquí haremos después la pantalla de gráficos de todas las huertas.
          </div>
        </div>
      );
    }

    if (huertasView === "new") return renderNewHuertaForm();
    if (huertasView === "addCut") return renderAddCutForm();
    if (huertasView === "cuts") return renderCutsContent();

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
              {canManageFarms && (
                <button
                  style={styles.editButton}
                  onClick={() => openEditHuerta(selectedFarm)}
                >
                  Editar huerta
                </button>
              )}

              {canAddCuts && (
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
            <div style={styles.detailFarmGrid}>
              <div>
                <strong>ESTADO:</strong> {selectedFarm.estado || "-"}
              </div>
              <div>
                <strong>REGIÓN:</strong> {selectedFarm.region || "-"}
              </div>
              <div>
                <strong>SECTOR:</strong> {selectedFarm.sector || "-"}
              </div>
              <div>
                <strong>COORDENADAS:</strong> {selectedFarm.coordenadas || "-"}
              </div>
              <div>
                <strong>LINK DE MAPS:</strong> {selectedFarm.maps_link || "-"}
              </div>
              <div>
                <strong>HECTÁREAS:</strong> {selectedFarm.hectareas || "-"}
              </div>
              <div>
                <strong>N° DE TERRENOS:</strong>{" "}
                {selectedFarm.numero_terrenos || "-"}
              </div>
              <div>
                <strong>TIPO DE SUELOS:</strong>{" "}
                {selectedFarm.tipo_suelos || "-"}
              </div>
              <div>
                <strong>VARIEDAD DE BANANO:</strong>{" "}
                {selectedFarm.variedad_banano || "-"}
              </div>
              <div>
                <strong>EDAD DE PLANTACIÓN:</strong>{" "}
                {selectedFarm.edad_plantacion || "-"}
              </div>
              <div>
                <strong>SISTEMA DE RIEGO:</strong>{" "}
                {selectedFarm.sistema_riego || "-"}
              </div>
              <div>
                <strong>FUENTE DE AGUA:</strong>{" "}
                {selectedFarm.fuente_agua || "-"}
              </div>
              <div>
                <strong>BOMBA DE AGUA:</strong> {selectedFarm.bomba_agua || "-"}
              </div>
              <div>
                <strong>PROP. MEDIDOR ELÉC.:</strong>{" "}
                {selectedFarm.prop_medidor_elec || "-"}
              </div>
              <div>
                <strong>EMPACADORA:</strong> {selectedFarm.empacadora || "-"}
              </div>
              <div>
                <strong>A FAVOR DE:</strong> {selectedFarm.a_favor_de || "-"}
              </div>
              <div>
                <strong>PRODUCCIÓN EST. MENSUAL:</strong>{" "}
                {selectedFarm.produccion_est_mensual || "-"}
              </div>
              <div>
                <strong>PRODUCCIÓN EST. ANUAL:</strong>{" "}
                {selectedFarm.produccion_est_anual || "-"}
              </div>
              <div>
                <strong>ENCARGADO:</strong> {selectedFarm.encargado || "-"}
              </div>
              <div>
                <strong>TELÉFONO ENCARGADO:</strong>{" "}
                {selectedFarm.telefono_encargado || "-"}
              </div>
              <div>
                <strong>EMPRESA COMPRADORA:</strong>{" "}
                {selectedFarm.empresa_compradora || "-"}
              </div>
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
            {canManageFarms && (
              <button style={styles.saveButton} onClick={openNewHuerta}>
                Nueva huerta
              </button>
            )}

            {canSeeMoney && (
              <button style={styles.exportButton} onClick={openHuertasGraphs}>
                Gráficos
              </button>
            )}
          </div>
        </div>

        {loadingFarms ? (
          <p>Cargando huertas...</p>
        ) : (
          <div style={styles.huertasListBox}>
            {farms.length === 0 ? (
              <div style={styles.huertaRow}>No hay huertas registradas</div>
            ) : (
              farms.map((farm) => (
                <div key={farm.id} style={styles.huertaRowWrapper}>
                  <button
                    style={styles.huertaRow}
                    onClick={() => openFarmDetail(farm)}
                  >
                    <span style={styles.huertaCode}>
                      {farm.code || "SIN-CODIGO"}
                    </span>
                    <span style={styles.huertaName}>{farm.name}</span>
                  </button>

                  {isAdmin && (
                    <button
                      style={styles.huertaDeleteButton}
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