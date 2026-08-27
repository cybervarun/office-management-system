import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilePlus,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiUserCheck
} from "react-icons/fi";
import { addInventory, listInventory, getAsset, deleteInventory, getDropdowns, addDropdownValue } from "../services/inventoryService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import FormSection from "../components/ui/FormSection";
import Modal from "../components/ui/Modal";
import AddDropdownItemModal from "../components/ui/AddDropdownItemModal";
import Select from "../components/ui/Select";
import Table from "../components/ui/Table";

/**
 * Initial form state with all government inventory format fields
 */
const initialForm = {
  // Section 1: Basic Information
  sr_no: "",
  ministry: "",
  department: "",
  mdo_location: "",
  division: "",
  asset_id: "",
  serial_number: "",
  asset_category: "",
  other_asset_category: "",
  
  // Section 2: Asset Location
  block_name: "",
  floor: "",
  room: "",
  workstation: "",
  
  // Section 3: Asset Details
  asset_description: "",
  make_brand_model: "",
  purchase_date: "",
  operating_system: "",
  other_operating_system: "",
  ip_address: "",
  mac_address: "",
  network_connection_type: "",
  
  // Section 4: Security & Management
  edr_installed: "",
  reason_no_edr: "",
  uem_installed: "",
  reason_no_uem: "",
  
  // Section 5: Ownership & Assignment
  asset_user: "",
  asset_custodian: "",
  asset_current_status: "",
  
  // Section 6: Lifecycle & Support
  date_of_removal: "",
  installation_date: "",
  end_of_support_date: "",
  end_of_life_date: "",
  amc_warranty: "",
  amc_warranty_expiry_date: "",
  critical: "",
  remarks: ""
};

const filterDefaults = {
  search: "",
  ministry: "",
  department: "",
  assetCategory: "",
  status: "",
  edr: "",
  uem: ""
};

/**
 * Validation rules for form fields
 */
const validationRules = {
  ministry: { required: true, message: "Ministry is required" },
  department: { required: true, message: "Department is required" },
  asset_category: { required: true, message: "Asset Category is required" },
  asset_description: { required: true, message: "Asset Description is required" },
  asset_current_status: { required: true, message: "Asset Current Status is required" },
  asset_user: { required: true, message: "Asset User is required" },
  asset_custodian: { required: true, message: "Asset Custodian is required" },
  ip_address: { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: "Invalid IP address format" },
  mac_address: { pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, message: "Invalid MAC address format" },
  purchase_date: { dateLogic: (val, form) => !val || !form.end_of_life_date || new Date(val) <= new Date(form.end_of_life_date) || "Purchase date must be before end of life date" },
  amc_warranty_expiry_date: { dateLogic: (val, form) => !val || !form.purchase_date || new Date(val) >= new Date(form.purchase_date) || "Warranty expiry cannot be before purchase date" }
};

// Additional cross-field validation enforced in validateForm: either serial_number or mac_address must be provided


/**
 * Conditional logic: Ministry to Department and MDO Location mappings
 */
const ministryDependencies = {
  "Ministry of Science and Technology": {
    mdo_location: "MDO Location", // placeholder for parent group
    departments: [
      { name: "Department of Biotechnology", mdo_location: "CGO Complex" },
      { name: "Department of Science and Technology", mdo_location: "Technology Bhavan" },
      { name: "Department of Scientific and Industrial Research", mdo_location: "Technology Bhavan" }
    ]
  },
  "Ministry of Environment, Forest and Climate Change": {
    mdo_location: "Indira Paryavaran Bhawan",
    departments: [] // all departments available, no filtering
  }
};

/**
 * Standard options for dropdown fields
 */
const standardOptions = {
  assetCategories: [
    "Desktop Computer",
    "Laptop",
    "Server",
    "Printer",
    "Network Equipment",
    "Peripheral",
    "Software License",
    "Other"
  ],
  operatingSystems: [
    "Windows 10",
    "Windows 11",
    "Windows Server 2019",
    "Windows Server 2022",
    "Ubuntu",
    "CentOS",
    "macOS",
    "Other"
  ],
  networkConnectionTypes: [
    "Ethernet",
    "WiFi",
    "Both",
    "None"
  ],
  assetStatus: [
    "Active",
    "Inactive",
    "In Repair",
    "Disposed",
    "Lost"
  ],
  yesNo: ["Yes", "No"],
  amcWarranty: ["AMC", "Warranty", "None"]
};

const pageSize = 8;

/**
 * Validate form based on validation rules
 */
const validateForm = (form) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field];
    const value = form[field];
    
    if (rule.required && !value) {
      errors[field] = rule.message;
    } else if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message;
    } else if (rule.dateLogic && value) {
      const result = rule.dateLogic(value, form);
      if (result !== true) {
        errors[field] = result;
      }
    }
  });

  // Cross-field: require either serial_number or mac_address
  if (!form.serial_number && !form.mac_address) {
    errors.serial_number = "Provide serial number or MAC address to generate a unique Asset ID";
    errors.mac_address = "Provide serial number or MAC address to generate a unique Asset ID";
  }
  
  return errors;
};

const getAssetType = (item) => {
  const category = String(item.asset_category || "").toLowerCase();
  if (category.includes("laptop")) return "Laptop";
  if (category.includes("server")) return "Server";
  if (category.includes("printer")) return "Printer";
  if (category.includes("desktop")) return "Desktop";
  return category || "Asset";
};

const getAssetStatus = (item) => {
  return item.asset_current_status || "Not Assigned";
};

const getSecurityState = (item, offset = 0) => (Number(item.id || 0) + offset) % 3 === 0 ? "Attention" : "Compliant";

const getBadgeTone = (value) => {
  if (["Assigned", "Compliant", "Active", "Yes"].includes(value)) return "success";
  if (["Available", "Not Assigned"].includes(value)) return "info";
  if (["Attention", "Faulty", "No", "In Repair"].includes(value)) return "warning";
  return "neutral";
};

const getUniqueOptions = (items, key) => [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();

const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const parseCsv = (text) => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((item) => item.replace(/^"|"$/g, "").trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
      return headers.reduce((row, header, index) => {
        row[header] = String(values[index] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
        return row;
      }, {});
    });
};

export default function InventoryManagement() {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [filters, setFilters] = useState(filterDefaults);
  const [sort, setSort] = useState({ key: "created_at", direction: "desc" });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownModal, setDropdownModal] = useState({ open: false, field: "", label: "" });
  const [dropdownOptions, setDropdownOptions] = useState({
    ministry: [],
    department: [],
    asset_category: [],
    operating_system: [],
    network_connection_type: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [viewAsset, setViewAsset] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  /**
   * Map client-side filter/sort/page state to API query params
   */
  const buildParams = () => {
    const params = {
      page,
      pageSize: 8,
      sortBy: sort.key === "created_at" ? "created_at" : sort.key,
      sortDirection: sort.direction
    };

    if (filters.search) params.search = filters.search;
    if (filters.ministry) params.ministry = filters.ministry;
    if (filters.department) params.department = filters.department;
    if (filters.assetCategory) params.asset_category = filters.assetCategory;
    if (filters.status) params.asset_current_status = filters.status;

    return params;
  };

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const params = buildParams();
      const [result, dropdownData] = await Promise.all([listInventory(params), getDropdowns()]);
      setItems(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || { page, pageSize: 8, total: 0, totalPages: 1 });
      setDropdownOptions({
        ministry: dropdownData?.ministry || [],
        department: dropdownData?.department || [],
        asset_category: dropdownData?.asset_category || [],
        operating_system: dropdownData?.operating_system || [],
        network_connection_type: dropdownData?.network_connection_type || []
      });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, sort]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const options = useMemo(
    () => {
      // Filter departments based on selected ministry
      let availableDepartments = [...new Set([...(dropdownOptions.department || []), ...getUniqueOptions(items, "department")])].sort();
      
      const ministryDeps = ministryDependencies[form.ministry];
      if (ministryDeps && ministryDeps.departments.length > 0) {
        // Restrict to only departments mapped for this ministry
        const allowedDeptNames = ministryDeps.departments.map((d) => d.name);
        availableDepartments = availableDepartments.filter((dept) => allowedDeptNames.includes(dept));
      }
      
      return {
        ministries: [...new Set([...(dropdownOptions.ministry || []), ...getUniqueOptions(items, "ministry")])].sort(),
        departments: availableDepartments,
        assetCategories: [...new Set([...(dropdownOptions.asset_category || []), ...standardOptions.assetCategories, ...getUniqueOptions(items, "asset_category")])],
        operatingSystems: [...new Set([...(dropdownOptions.operating_system || []), ...standardOptions.operatingSystems, ...getUniqueOptions(items, "operating_system")])],
        networkConnectionTypes: [...new Set([...(dropdownOptions.network_connection_type || []), ...standardOptions.networkConnectionTypes, ...getUniqueOptions(items, "network_connection_type")])],
        assetStatus: [...standardOptions.assetStatus, ...getUniqueOptions(items, "asset_current_status")],
        assetTypes: [...new Set(items.map(getAssetType))].sort()
      };
    },
    [items, dropdownOptions, form.ministry]
  );

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        assetType: getAssetType(item),
        status: getAssetStatus(item),
        edr: getSecurityState(item),
        uem: getSecurityState(item, 1)
      })),
    [items]
  );

  // Filtering, sorting, and pagination are now server-side via the API.
  // enrichedItems adds computed display fields (assetType, status, edr, uem) on the current page.
  const totalPages = pagination.totalPages;

  const stats = useMemo(
    () => [
      { label: "Total Assets", value: pagination.total },
      { label: "Current Page", value: items.length },
      { label: "Active", value: enrichedItems.filter((item) => item.status !== "In Repair").length },
      { label: "In Repair", value: enrichedItems.filter((item) => item.status === "In Repair").length },
      { label: "Assigned", value: enrichedItems.filter((item) => item.asset_user).length }
    ],
    [enrichedItems, pagination.total, items.length]
  );

  const handleFormChange = (fieldName, value) => {
    setForm(prev => ({ ...prev, [fieldName]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const addNewOptionValue = (field) => `__add_new_${field}`;

  /**
   * Handle ministry selection with auto-dependent field updates
   */
  const handleMinistrySelect = (event) => {
    const selectedMinistry = event.target.value;
    
    if (selectedMinistry === addNewOptionValue("ministry")) {
      setDropdownModal({ open: true, field: "ministry", label: "Ministry" });
      return;
    }

    handleFormChange("ministry", selectedMinistry);

    // Apply conditional logic based on ministry
    const dependencies = ministryDependencies[selectedMinistry];
    if (dependencies) {
      // Auto-set MDO Location if specified
      if (dependencies.mdo_location && dependencies.mdo_location !== "MDO Location") {
        handleFormChange("mdo_location", dependencies.mdo_location);
      }
      
      // Reset department when ministry changes
      handleFormChange("department", "");
    } else {
      // Reset MDO Location and Department if no special rules apply
      handleFormChange("mdo_location", "");
      handleFormChange("department", "");
    }
  };

  /**
   * Handle department selection with auto-dependent field updates
   */
  const handleDepartmentSelect = (event) => {
    const selectedDepartment = event.target.value;
    
    if (selectedDepartment === addNewOptionValue("department")) {
      setDropdownModal({ open: true, field: "department", label: "Department" });
      return;
    }

    handleFormChange("department", selectedDepartment);

    // Apply conditional logic based on ministry and department
    const ministry = form.ministry;
    const dependencies = ministryDependencies[ministry];
    
    if (dependencies && dependencies.departments.length > 0) {
      // Find the department in the mapping and auto-set MDO Location
      const deptMapping = dependencies.departments.find((d) => d.name === selectedDepartment);
      if (deptMapping) {
        handleFormChange("mdo_location", deptMapping.mdo_location);
      }
    }
  };

  const handleDropdownSelect = (field, label) => (event) => {
    const value = event.target.value;
    if (value === addNewOptionValue(field)) {
      setDropdownModal({ open: true, field, label });
      return;
    }
    handleFormChange(field, value);
  };

  const handleCreateDropdownEntry = async (value) => {
    if (!value || !dropdownModal.field) return;
    try {
      const result = await addDropdownValue({ field: dropdownModal.field, value });
      const savedValue = result?.value || result?.name || value;
      setDropdownOptions((prev) => ({
        ...prev,
        [dropdownModal.field]: [...new Set([...(prev[dropdownModal.field] || []), savedValue])]
      }));
      setForm((prev) => ({ ...prev, [dropdownModal.field]: savedValue }));
      setToast(`${dropdownModal.label} added`);
      setDropdownModal({ open: false, field: "", label: "" });
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Unable to add ${dropdownModal.label}`);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormErrors({});
    
    // Validate form
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError("Please fix validation errors before saving");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await addInventory(form);

      // Backend returns { existing: true, asset } or { existing: false, asset }
      if (response && response.asset) {
        setForm(prev => ({ ...prev, asset_id: response.asset.asset_id, sr_no: response.asset.sr_no }));
        if (response.existing) {
          setToast("Asset already exists — loaded existing record");
        } else {
          setToast("Asset added successfully");
          setModalOpen(false);
          setForm(initialForm);
        }
      } else if (response && response.asset_id) {
        // legacy response
        setForm(prev => ({ ...prev, asset_id: response.asset_id, sr_no: response.sr_no || prev.sr_no }));
        setToast("Asset added successfully");
        setModalOpen(false);
        setForm(initialForm);
      } else {
        setToast("Asset processed");
        setModalOpen(false);
        setForm(initialForm);
      }

      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unable to save asset");
    } finally {
      setSaving(false);
    }
  };

  const sortBy = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const exportCsv = () => {
    const columns = Object.keys(initialForm);
    const rows = items.map((item) => columns.map((column) => `"${String(item[column] || "").replace(/"/g, '""')}"`).join(","));
    downloadFile([columns.join(","), ...rows].join("\n"), "inventory-assets.csv", "text/csv;charset=utf-8");
    setToast("Inventory exported");
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const rows = parseCsv(await file.text());
      for (const row of rows) {
        const payload = Object.keys(initialForm).reduce((next, key) => ({ ...next, [key]: row[key] || "" }), {});
        await addInventory(payload);
      }
      setToast(`${rows.length} asset records imported`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "CSV import failed");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const loadAssetDetail = async (id) => {
    setViewLoading(true);
    try {
      const asset = await getAsset(id);
      setViewAsset(asset);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load asset details");
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) return;
    try {
      await deleteInventory(id);
      setToast("Asset deleted successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Assets / Inventory</p>
          <h1>Inventory Management</h1>
          <p>Track government IT assets, assignment status, and endpoint compliance from one workspace.</p>
        </div>
        <Button icon={FiPlus} onClick={() => setModalOpen(true)}>
          Add Asset
        </Button>
      </div>

      <div className="stats-grid">
        {stats.map((card) => (
          <article className="stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            x
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <section className="filter-card" aria-label="Inventory filters">
        <div className="filter-search">
          <FiSearch aria-hidden="true" />
          <input
            placeholder="Search by user, email, phone, department, asset ID, category"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <Select
          label="Ministry"
          options={options.ministries}
          placeholder="All ministries"
          value={filters.ministry}
          onChange={(event) => setFilters({ ...filters, ministry: event.target.value })}
        />
        <Select
          label="Department"
          options={options.departments}
          placeholder="All departments"
          value={filters.department}
          onChange={(event) => setFilters({ ...filters, department: event.target.value })}
        />
        <Select
          label="Asset Category"
          options={options.assetCategories}
          placeholder="All categories"
          value={filters.assetCategory}
          onChange={(event) => setFilters({ ...filters, assetCategory: event.target.value })}
        />
        <Select
          label="Status"
          options={options.assetStatus}
          placeholder="All status"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        />
        <Select
          label="EDR"
          options={["Compliant", "Attention"]}
          placeholder="All EDR"
          value={filters.edr}
          onChange={(event) => setFilters({ ...filters, edr: event.target.value })}
        />
        <Select
          label="UEM"
          options={["Compliant", "Attention"]}
          placeholder="All UEM"
          value={filters.uem}
          onChange={(event) => setFilters({ ...filters, uem: event.target.value })}
        />
        <div className="filter-actions">
          <Button icon={FiUpload} onClick={() => fileInputRef.current?.click()} variant="secondary">
            Import CSV
          </Button>
          <Button icon={FiDownload} onClick={exportCsv} variant="secondary">
            Export CSV
          </Button>
          <Button icon={FiRefreshCw} onClick={() => setFilters(filterDefaults)} variant="ghost">
            Reset
          </Button>
          <input accept=".csv" hidden onChange={importCsv} ref={fileInputRef} type="file" />
        </div>
      </section>

      <section className="data-card">
        <div className="section-title">
          <div>
            <h2>Asset Register</h2>
            <p>{pagination.total} records found</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading inventory records
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <FiFilePlus aria-hidden="true" />
            <h2>No inventory records found</h2>
            <p>Add an asset or clear filters to view records.</p>
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  {[
                    ["asset_user", "Asset User"],
                    ["assetType", "Type"],
                    ["department", "Department"],
                    ["asset_id", "Asset ID"],
                    ["status", "Status"],
                    ["edr", "EDR"],
                    ["uem", "UEM"]
                  ].map(([key, label]) => (
                    <th key={key}>
                      <button className="th-button" onClick={() => sortBy(key)}>
                        {label}
                        {sort.key === key && <span>{sort.direction === "asc" ? "up" : "down"}</span>}
                      </button>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="asset-cell">
                        <strong>{item.asset_user || "Unassigned"}</strong>
                        <span>{item.email}</span>
                      </div>
                    </td>
                    <td>{item.assetType}</td>
                    <td>{item.department}</td>
                    <td>{item.asset_id}</td>
                    <td>
                      <Badge tone={getBadgeTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td>
                      <Badge tone={getBadgeTone(item.edr)}>{item.edr}</Badge>
                    </td>
                    <td>
                      <Badge tone={getBadgeTone(item.uem)}>{item.uem}</Badge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Button icon={FiEye} onClick={() => loadAssetDetail(item.id)} size="icon" variant="ghost">
                          View
                        </Button>
                        <Button icon={FiEdit2} onClick={() => showPendingAction("Edit")} size="icon" variant="ghost">
                          Edit
                        </Button>
                        <Button icon={FiTrash2} onClick={() => handleDeleteAsset(item.id)} size="icon" variant="ghost">
                          Delete
                        </Button>
                        <Button icon={FiUserCheck} onClick={() => showPendingAction("Assign")} size="icon" variant="ghost">
                          Assign
                        </Button>
                        <Button icon={FiClock} onClick={() => showPendingAction("History")} size="icon" variant="ghost">
                          History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="pagination">
              <span>
                Page {page} of {totalPages}
              </span>
              <div>
                <Button disabled={page === 1} onClick={() => setPage((value) => value - 1)} variant="secondary">
                  Previous
                </Button>
                <Button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} variant="secondary">
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        footer={
          <>
            <Button onClick={() => { setModalOpen(false); setFormErrors({}); }} variant="secondary">
              Cancel
            </Button>
            <Button disabled={saving} form="asset-form" type="submit">
              {saving ? "Saving" : "Save Asset"}
            </Button>
          </>
        }
        onClose={() => { setModalOpen(false); setFormErrors({}); }}
        open={modalOpen}
        title="Add Asset - Government Inventory Format"
      >
        <form className="modal-form" id="asset-form" onSubmit={submit}>
          {/* Section 1: Basic Information */}
          <FormSection title="Section 1: Basic Information" description="Enter asset identification and organizational details">
            <div className="form-grid-2">
              <FormInput
                label="Sr. No."
                name="sr_no"
                value={form.sr_no}
                onChange={() => {}}
                type="text"
                readOnly
                className="field-readonly"
              />
              <Select
                label="Ministry *"
                name="ministry"
                options={[...options.ministries, { value: addNewOptionValue("ministry"), label: "+ Add New Ministry" }]}
                placeholder="Select Ministry"
                value={form.ministry}
                onChange={handleMinistrySelect}
              />
              <Select
                label="Department *"
                name="department"
                options={[...options.departments, { value: addNewOptionValue("department"), label: "+ Add New Department" }]}
                placeholder="Select Department"
                value={form.department}
                onChange={handleDepartmentSelect}
              />
              <FormInput
                label="MDO Location"
                name="mdo_location"
                value={form.mdo_location}
                onChange={(e) => handleFormChange("mdo_location", e.target.value)}
                type="text"
              />
              <FormInput
                label="Division / Section / Group"
                name="division"
                value={form.division}
                onChange={(e) => handleFormChange("division", e.target.value)}
                type="text"
              />
              <FormInput
                label="Asset ID"
                name="asset_id"
                value={form.asset_id}
                onChange={() => {}}
                type="text"
                readOnly
                className="field-readonly"
              />
              <FormInput
                label="Serial Number (preferred)"
                name="serial_number"
                value={form.serial_number}
                onChange={(e) => handleFormChange("serial_number", e.target.value)}
                type="text"
                placeholder="Hardware serial number"
              />
              <Select
                label="Asset Category *"
                name="asset_category"
                options={[...options.assetCategories, { value: addNewOptionValue("asset_category"), label: "+ Add New Asset Category" }]}
                placeholder="Select Category"
                value={form.asset_category}
                onChange={handleDropdownSelect("asset_category", "Asset Category")}
              />
              {form.asset_category === "Other" && (
                <FormInput
                  label="Other Asset Category"
                  name="other_asset_category"
                  value={form.other_asset_category}
                  onChange={(e) => handleFormChange("other_asset_category", e.target.value)}
                  type="text"
                />
              )}
            </div>
            {formErrors.ministry && <span className="field-error">{formErrors.ministry}</span>}
            {formErrors.department && <span className="field-error">{formErrors.department}</span>}
            {formErrors.asset_id && <span className="field-error">{formErrors.asset_id}</span>}
            {formErrors.asset_category && <span className="field-error">{formErrors.asset_category}</span>}
          </FormSection>

          {/* Section 2: Asset Location */}
          <FormSection title="Section 2: Asset Location" description="Specify the physical location of the asset">
            <div className="form-grid-4">
              <FormInput
                label="Block"
                name="block_name"
                value={form.block_name}
                onChange={(e) => handleFormChange("block_name", e.target.value)}
                type="text"
              />
              <FormInput
                label="Floor"
                name="floor"
                value={form.floor}
                onChange={(e) => handleFormChange("floor", e.target.value)}
                type="text"
              />
              <FormInput
                label="Room"
                name="room"
                value={form.room}
                onChange={(e) => handleFormChange("room", e.target.value)}
                type="text"
              />
              <FormInput
                label="Workstation"
                name="workstation"
                value={form.workstation}
                onChange={(e) => handleFormChange("workstation", e.target.value)}
                type="text"
              />
            </div>
          </FormSection>

          {/* Section 3: Asset Details */}
          <FormSection title="Section 3: Asset Details" description="Provide technical specifications and connectivity information">
            <div className="form-grid-2">
              <div style={{ gridColumn: "1 / -1" }}>
                <FormInput
                  label="Asset Description *"
                  name="asset_description"
                  value={form.asset_description}
                  onChange={(e) => handleFormChange("asset_description", e.target.value)}
                  type="text"
                />
              </div>
              <FormInput
                label="Make / Brand / Model"
                name="make_brand_model"
                value={form.make_brand_model}
                onChange={(e) => handleFormChange("make_brand_model", e.target.value)}
                type="text"
              />
              <FormInput
                label="Purchase Date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={(e) => handleFormChange("purchase_date", e.target.value)}
                type="date"
              />
              <Select
                label="Operating System"
                name="operating_system"
                options={[...options.operatingSystems, { value: addNewOptionValue("operating_system"), label: "+ Add New Operating System" }]}
                placeholder="Select OS"
                value={form.operating_system}
                onChange={handleDropdownSelect("operating_system", "Operating System")}
              />
              {form.operating_system === "Other" && (
                <FormInput
                  label="Other Operating System"
                  name="other_operating_system"
                  value={form.other_operating_system}
                  onChange={(e) => handleFormChange("other_operating_system", e.target.value)}
                  type="text"
                />
              )}
              <FormInput
                label="IP Address"
                name="ip_address"
                value={form.ip_address}
                onChange={(e) => handleFormChange("ip_address", e.target.value)}
                type="text"
                placeholder="e.g., 192.168.1.1"
              />
              {formErrors.ip_address && <span className="field-error">{formErrors.ip_address}</span>}
              <FormInput
                label="MAC Address"
                name="mac_address"
                value={form.mac_address}
                onChange={(e) => handleFormChange("mac_address", e.target.value)}
                type="text"
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
              />
              {formErrors.mac_address && <span className="field-error">{formErrors.mac_address}</span>}
              <Select
                label="Network Connection Type"
                name="network_connection_type"
                options={[...options.networkConnectionTypes, { value: addNewOptionValue("network_connection_type"), label: "+ Add New Network Connection Type" }]}
                placeholder="Select Type"
                value={form.network_connection_type}
                onChange={handleDropdownSelect("network_connection_type", "Network Connection Type")}
              />
            </div>
            {formErrors.asset_description && <span className="field-error">{formErrors.asset_description}</span>}
          </FormSection>

          {/* Section 4: Security & Management */}
          <FormSection title="Section 4: Security & Management" description="Endpoint Detection and Response (EDR) and Unified Endpoint Management (UEM) status">
            <div className="form-grid-2">
              <Select
                label="EDR Installed"
                name="edr_installed"
                options={standardOptions.yesNo}
                placeholder="Select"
                value={form.edr_installed}
                onChange={(e) => handleFormChange("edr_installed", e.target.value)}
              />
              {form.edr_installed === "No" && (
                <FormInput
                  label="Reason for No EDR"
                  name="reason_no_edr"
                  value={form.reason_no_edr}
                  onChange={(e) => handleFormChange("reason_no_edr", e.target.value)}
                  type="text"
                />
              )}
              <Select
                label="UEM Installed"
                name="uem_installed"
                options={standardOptions.yesNo}
                placeholder="Select"
                value={form.uem_installed}
                onChange={(e) => handleFormChange("uem_installed", e.target.value)}
              />
              {form.uem_installed === "No" && (
                <FormInput
                  label="Reason for No UEM"
                  name="reason_no_uem"
                  value={form.reason_no_uem}
                  onChange={(e) => handleFormChange("reason_no_uem", e.target.value)}
                  type="text"
                />
              )}
            </div>
          </FormSection>

          {/* Section 5: Ownership & Assignment */}
          <FormSection title="Section 5: Ownership & Assignment" description="Asset user and custodian information">
            <div className="form-grid-2">
              <div style={{ gridColumn: "1 / -1" }}>
                <FormInput
                  label="Asset User *"
                  name="asset_user"
                  value={form.asset_user}
                  onChange={(e) => handleFormChange("asset_user", e.target.value)}
                  type="text"
                />
                <small style={{ display: "block", marginTop: "4px", color: "#666" }}>
                  Mention Asset user name OR for common use assets (BAS, WIFI Access Point etc.) write "Common User"
                </small>
              </div>
              <FormInput
                label="Asset Custodian *"
                name="asset_custodian"
                value={form.asset_custodian}
                onChange={(e) => handleFormChange("asset_custodian", e.target.value)}
                type="text"
              />
              <Select
                label="Asset Current Status *"
                name="asset_current_status"
                options={standardOptions.assetStatus}
                placeholder="Select Status"
                value={form.asset_current_status}
                onChange={(e) => handleFormChange("asset_current_status", e.target.value)}
              />
            </div>
            {formErrors.asset_user && <span className="field-error">{formErrors.asset_user}</span>}
            {formErrors.asset_custodian && <span className="field-error">{formErrors.asset_custodian}</span>}
            {formErrors.asset_current_status && <span className="field-error">{formErrors.asset_current_status}</span>}
          </FormSection>

          {/* Section 6: Lifecycle & Support */}
          <FormSection title="Section 6: Lifecycle & Support" description="Asset lifecycle dates and warranty information">
            <div className="form-grid-2">
              <FormInput
                label="Installation Date"
                name="installation_date"
                value={form.installation_date}
                onChange={(e) => handleFormChange("installation_date", e.target.value)}
                type="date"
              />
              <FormInput
                label="Date of Removal"
                name="date_of_removal"
                value={form.date_of_removal}
                onChange={(e) => handleFormChange("date_of_removal", e.target.value)}
                type="date"
              />
              <FormInput
                label="End of Support Date"
                name="end_of_support_date"
                value={form.end_of_support_date}
                onChange={(e) => handleFormChange("end_of_support_date", e.target.value)}
                type="date"
              />
              <FormInput
                label="End of Life Date"
                name="end_of_life_date"
                value={form.end_of_life_date}
                onChange={(e) => handleFormChange("end_of_life_date", e.target.value)}
                type="date"
              />
              {formErrors.purchase_date && <span className="field-error">{formErrors.purchase_date}</span>}
              <Select
                label="Whether in AMC (A) or Warranty (W)"
                name="amc_warranty"
                options={standardOptions.amcWarranty}
                placeholder="Select"
                value={form.amc_warranty}
                onChange={(e) => handleFormChange("amc_warranty", e.target.value)}
              />
              <FormInput
                label="A/W Expiry Date"
                name="amc_warranty_expiry_date"
                value={form.amc_warranty_expiry_date}
                onChange={(e) => handleFormChange("amc_warranty_expiry_date", e.target.value)}
                type="date"
              />
              {formErrors.amc_warranty_expiry_date && <span className="field-error">{formErrors.amc_warranty_expiry_date}</span>}
              <Select
                label="Critical (Y/N)"
                name="critical"
                options={standardOptions.yesNo}
                placeholder="Select"
                value={form.critical}
                onChange={(e) => handleFormChange("critical", e.target.value)}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="field">
                  <span>Remarks</span>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={(e) => handleFormChange("remarks", e.target.value)}
                    rows="3"
                  />
                </label>
              </div>
            </div>
          </FormSection>
        </form>
      </Modal>
      <AddDropdownItemModal
        open={dropdownModal.open}
        fieldLabel={dropdownModal.label}
        onClose={() => setDropdownModal({ open: false, field: "", label: "" })}
        onSave={handleCreateDropdownEntry}
      />

      <Modal
        open={!!viewAsset}
        onClose={() => setViewAsset(null)}
        title={`Asset Details - ${viewAsset?.asset_id || ""}`}
        footer={
          <Button onClick={() => setViewAsset(null)} variant="secondary">
            Close
          </Button>
        }
      >
        {viewLoading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading asset details
          </div>
        ) : viewAsset ? (
          <div className="modal-form">
            <FormSection title="Section 1: Basic Information">
              <div className="form-grid-2">
                <FormInput label="Asset ID" value={viewAsset.asset_id || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Sr. No." value={viewAsset.sr_no || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Ministry" value={viewAsset.ministry || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Department" value={viewAsset.department || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="MDO Location" value={viewAsset.mdo_location || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Division" value={viewAsset.division || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Serial Number" value={viewAsset.serial_number || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Asset Category" value={viewAsset.asset_category || "—"} type="text" className="field-readonly" readOnly />
              </div>
            </FormSection>
            <FormSection title="Section 2: Asset Location">
              <div className="form-grid-4">
                <FormInput label="Block" value={viewAsset.block_name || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Floor" value={viewAsset.floor || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Room" value={viewAsset.room || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Workstation" value={viewAsset.workstation || "—"} type="text" className="field-readonly" readOnly />
              </div>
            </FormSection>
            <FormSection title="Section 3: Asset Details">
              <div className="form-grid-2">
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormInput label="Asset Description" value={viewAsset.asset_description || "—"} type="text" className="field-readonly" readOnly />
                </div>
                <FormInput label="Make / Brand / Model" value={viewAsset.make_brand_model || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Purchase Date" value={viewAsset.purchase_date || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Operating System" value={viewAsset.operating_system || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="IP Address" value={viewAsset.ip_address || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="MAC Address" value={viewAsset.mac_address || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Network Connection Type" value={viewAsset.network_connection_type || "—"} type="text" className="field-readonly" readOnly />
              </div>
            </FormSection>
            <FormSection title="Section 4: Security & Management">
              <div className="form-grid-2">
                <FormInput label="EDR Installed" value={viewAsset.edr_installed || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Reason for No EDR" value={viewAsset.reason_no_edr || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="UEM Installed" value={viewAsset.uem_installed || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Reason for No UEM" value={viewAsset.reason_no_uem || "—"} type="text" className="field-readonly" readOnly />
              </div>
            </FormSection>
            <FormSection title="Section 5: Ownership & Assignment">
              <div className="form-grid-2">
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormInput label="Asset User" value={viewAsset.asset_user || "—"} type="text" className="field-readonly" readOnly />
                </div>
                <FormInput label="Asset Custodian" value={viewAsset.asset_custodian || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Asset Current Status" value={viewAsset.asset_current_status || "—"} type="text" className="field-readonly" readOnly />
              </div>
            </FormSection>
            <FormSection title="Section 6: Lifecycle & Support">
              <div className="form-grid-2">
                <FormInput label="Installation Date" value={viewAsset.installation_date || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Date of Removal" value={viewAsset.date_of_removal || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="End of Support Date" value={viewAsset.end_of_support_date || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="End of Life Date" value={viewAsset.end_of_life_date || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="AMC / Warranty" value={viewAsset.amc_warranty || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="A/W Expiry Date" value={viewAsset.amc_warranty_expiry_date || "—"} type="text" className="field-readonly" readOnly />
                <FormInput label="Critical" value={viewAsset.critical || "—"} type="text" className="field-readonly" readOnly />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="field field-readonly">
                    <span>Remarks</span>
                    <textarea rows="3" readOnly value={viewAsset.remarks || ""} />
                  </label>
                </div>
              </div>
            </FormSection>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
