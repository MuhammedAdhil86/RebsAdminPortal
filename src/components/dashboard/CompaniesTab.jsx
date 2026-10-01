import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Search } from "lucide-react";
import DashboardTable from "../../utils/DashboardTable";

/* ------------------------------------------------------------------ */
/*  DUMMY DATA                                                        */
/* ------------------------------------------------------------------ */

export const COMPANY_ONBOARDING = [
  {
    id: 1,
    company: "Techno Soft Solutions",
    contact: "Rahul Menon",
    plan: "Enterprise",
    stage: "Live",
    progress: 100,
    status: "Active",
  },
  {
    id: 2,
    company: "Bright Retail Pvt Ltd",
    contact: "Anita Joseph",
    plan: "Business",
    stage: "Live",
    progress: 100,
    status: "Active",
  },
  {
    id: 3,
    company: "Greenfield Logistics",
    contact: "Suresh Kumar",
    plan: "Starter",
    stage: "Documents Pending",
    progress: 25,
    status: "Pending",
  },
  {
    id: 4,
    company: "Nova Health Care",
    contact: "Dr. Meera Nair",
    plan: "Enterprise",
    stage: "Completed",
    progress: 100,
    status: "Active",
  },
  {
    id: 5,
    company: "Skyline Constructions",
    contact: "Vinod Pillai",
    plan: "Business",
    stage: "Completed",
    progress: 100,
    status: "Active",
  },
  {
    id: 6,
    company: "Orbit Media",
    contact: "Divya S",
    plan: "Starter",
    stage: "Verification",
    progress: 40,
    status: "In Progress",
  },
  {
    id: 7,
    company: "Zenith Traders",
    contact: "Faisal Ahmed",
    plan: "Starter",
    stage: "Live",
    progress: 100,
    status: "Active",
  },
];

export const INITIAL_USERS = [
  {
    id: 1,
    name: "Arun Prakash",
    company: "Techno Soft Solutions",
    role: "Company Admin",
    email: "arun@technosoft.com",
    invited: "05 Feb",
    status: "Active",
  },
  {
    id: 2,
    name: "Lekshmi R",
    company: "Bright Retail Pvt Ltd",
    role: "HR Manager",
    email: "lekshmi@brightretail.in",
    invited: "06 Feb",
    status: "Active",
  },
  {
    id: 3,
    name: "Sanjay Varghese",
    company: "Greenfield Logistics",
    role: "Company Admin",
    email: "sanjay@greenfield.co",
    invited: "07 Feb",
    status: "Pending",
  },
  {
    id: 4,
    name: "Dr. Meera Nair",
    company: "Nova Health Care",
    role: "Company Admin",
    email: "meera@novahealth.in",
    invited: "01 Feb",
    status: "Active",
  },
  {
    id: 5,
    name: "Vinod Pillai",
    company: "Skyline Constructions",
    role: "Manager",
    email: "vinod@skyline.in",
    invited: "02 Feb",
    status: "Active",
  },
  {
    id: 6,
    name: "Divya S",
    company: "Orbit Media",
    role: "HR Manager",
    email: "divya@orbitmedia.in",
    invited: "08 Feb",
    status: "Invited",
  },
  {
    id: 7,
    name: "Deepak Sharma",
    company: "Techno Soft Solutions",
    role: "Frontend Engineer",
    email: "deepak@technosoft.com",
    invited: "10 Feb",
    status: "Active",
  },
  {
    id: 8,
    name: "Faisal Ahmed",
    company: "Zenith Traders",
    role: "Company Admin",
    email: "faisal@zenith.com",
    invited: "11 Feb",
    status: "Active",
  },
];

// Fix: Dashboard.jsx imports USER_ONBOARDING, which no longer existed
// after the rename to INITIAL_USERS. This alias keeps both names working.
export const USER_ONBOARDING = INITIAL_USERS;

export const INITIAL_SHIFTS = [
  {
    id: 1,
    company: "Techno Soft Solutions",
    shiftName: "General Day Shift",
    timings: "09:00 AM - 06:00 PM",
    days: "Mon - Fri",
    allocatedTo: "Arun Prakash, Deepak Sharma",
    status: "Active",
  },
  {
    id: 2,
    company: "Techno Soft Solutions",
    shiftName: "Night Support Shift",
    timings: "09:00 PM - 06:00 AM",
    days: "Mon - Fri",
    allocatedTo: "Unallocated",
    status: "Active",
  },
  {
    id: 3,
    company: "Bright Retail Pvt Ltd",
    shiftName: "Retail Store Shift",
    timings: "10:00 AM - 07:00 PM",
    days: "Mon - Sat",
    allocatedTo: "Lekshmi R",
    status: "Active",
  },
  {
    id: 4,
    company: "Nova Health Care",
    shiftName: "Emergency Rotation",
    timings: "08:00 AM - 05:00 PM",
    days: "Mon - Sun",
    allocatedTo: "Dr. Meera Nair",
    status: "Active",
  },
  {
    id: 5,
    company: "Skyline Constructions",
    shiftName: "Site Operational Shift",
    timings: "08:30 AM - 05:30 PM",
    days: "Mon - Sat",
    allocatedTo: "Vinod Pillai",
    status: "Active",
  },
  {
    id: 6,
    company: "Zenith Traders",
    shiftName: "Warehouse Morning",
    timings: "09:30 AM - 06:30 PM",
    days: "Mon - Fri",
    allocatedTo: "Faisal Ahmed",
    status: "Active",
  },
];

export const INITIAL_LEAVES = [
  {
    id: 1,
    company: "Techno Soft Solutions",
    employee: "Deepak Sharma",
    leaveType: "Casual Leave",
    days: 3,
    startDate: "12 Oct 2026",
    endDate: "14 Oct 2026",
    reason: "Family event",
    status: "Approved",
  },
  {
    id: 2,
    company: "Techno Soft Solutions",
    employee: "Arun Prakash",
    leaveType: "Sick Leave",
    days: 2,
    startDate: "18 Oct 2026",
    endDate: "19 Oct 2026",
    reason: "Flu recovery",
    status: "Pending",
  },
  {
    id: 3,
    company: "Bright Retail Pvt Ltd",
    employee: "Lekshmi R",
    leaveType: "Earned Leave",
    days: 4,
    startDate: "20 Oct 2026",
    endDate: "24 Oct 2026",
    reason: "Annual vacation",
    status: "Approved",
  },
  {
    id: 4,
    company: "Nova Health Care",
    employee: "Dr. Meera Nair",
    leaveType: "Conference Leave",
    days: 2,
    startDate: "25 Oct 2026",
    endDate: "26 Oct 2026",
    reason: "Medical Summit",
    status: "Pending",
  },
  {
    id: 5,
    company: "Skyline Constructions",
    employee: "Vinod Pillai",
    leaveType: "Medical Leave",
    days: 3,
    startDate: "02 Oct 2026",
    endDate: "04 Oct 2026",
    reason: "Health Checkup",
    status: "Approved",
  },
];

export const INITIAL_PAYROLLS = [
  {
    id: 1,
    company: "Techno Soft Solutions",
    employee: "Arun Prakash",
    payGroup: "Executive Salaried",
    month: "September 2026",
    grossSalary: "$5,200",
    deductions: "$420",
    netPay: "$4,780",
    status: "Completed",
  },
  {
    id: 2,
    company: "Techno Soft Solutions",
    employee: "Deepak Sharma",
    payGroup: "Engineering Staff",
    month: "September 2026",
    grossSalary: "$4,100",
    deductions: "$350",
    netPay: "$3,750",
    status: "Completed",
  },
  {
    id: 3,
    company: "Bright Retail Pvt Ltd",
    employee: "Lekshmi R",
    payGroup: "Store Operations",
    month: "September 2026",
    grossSalary: "$3,800",
    deductions: "$280",
    netPay: "$3,520",
    status: "Completed",
  },
  {
    id: 4,
    company: "Nova Health Care",
    employee: "Dr. Meera Nair",
    payGroup: "Senior Medical Staff",
    month: "September 2026",
    grossSalary: "$6,500",
    deductions: "$600",
    netPay: "$5,900",
    status: "Due Soon",
  },
  {
    id: 5,
    company: "Skyline Constructions",
    employee: "Vinod Pillai",
    payGroup: "Field Engineering",
    month: "September 2026",
    grossSalary: "$4,300",
    deductions: "$310",
    netPay: "$3,990",
    status: "Completed",
  },
];

// Fix: leave types and pay groups you create are now saved and shown in the
// Allocate dropdowns. These are the defaults every company starts with.
const DEFAULT_LEAVE_TYPES = [
  { name: "Casual Leave", quota: 12 },
  { name: "Sick Leave", quota: 10 },
  { name: "Earned Leave", quota: 15 },
  { name: "Comp Off", quota: 5 },
];

const DEFAULT_PAY_GROUPS = [
  { name: "Engineering Staff", frequency: "Monthly" },
  { name: "Executive Salaried", frequency: "Monthly" },
  { name: "Store Operations", frequency: "Monthly" },
  { name: "Field Staff", frequency: "Monthly" },
];

export const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

export const avatar = (id) => `https://i.pravatar.cc/40?u=${id}`;

export const statusPill = (val) => {
  const map = {
    Online: "bg-green-100 text-green-600",
    Absent: "bg-red-100 text-red-600",
    Delay: "bg-blue-100 text-blue-600",
    Late: "bg-purple-100 text-purple-600",
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-600",
    Rejected: "bg-red-100 text-red-600",
    "In Progress": "bg-blue-100 text-blue-600",
    Completed: "bg-green-100 text-green-600",
    Active: "bg-green-100 text-green-600",
    Invited: "bg-blue-100 text-blue-600",
    New: "bg-purple-100 text-purple-600",
    Converted: "bg-green-100 text-green-600",
    Closed: "bg-gray-100 text-gray-600",
    Overdue: "bg-red-100 text-red-600",
    "Due Soon": "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[12.5px] ${
        map[val] || "bg-gray-100 text-gray-600"
      }`}
    >
      {val}
    </span>
  );
};

export const nameCell = (val, row) => (
  <div className="flex items-center gap-2">
    <img
      src={row.image || avatar(row.id)}
      alt={val}
      className="w-8 h-8 rounded-full object-cover border"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          val,
        )}&background=random`;
      }}
    />
    <span className="truncate max-w-[140px] font-medium">{val}</span>
  </div>
);

export const companyCell = (val) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0">
      {initials(val)}
    </div>
    <span className="truncate max-w-[160px] font-medium text-gray-900">
      {val}
    </span>
  </div>
);

export const progressCell = (val) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-black rounded-full"
        style={{ width: `${val}%` }}
      />
    </div>
    <span className="text-[11px] text-gray-500 w-8 text-right">{val}%</span>
  </div>
);

export function SearchBox({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 border px-2 py-1.5 rounded-md bg-gray-50 text-xs w-36 sm:w-44">
      <input
        type="text"
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent w-full focus:outline-none text-xs placeholder:text-gray-400"
      />
      <Search className="w-3.5 h-3.5 text-gray-400" />
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 font-[Poppins]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900 font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon
              icon="heroicons:x-mark-20-solid"
              className="w-5 h-5 text-gray-400"
            />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Old name kept so other files that import UniversalTable from here still work
export { DashboardTable as UniversalTable };

const inputClass =
  "w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black";

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// Inline form panel shown on the page (replaces the old popups)
function InlineForm({ title, submitLabel, onSubmit, onClose, children }) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-100 rounded-lg shadow-sm p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-gray-900 font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close form"
        >
          <Icon
            icon="heroicons:x-mark-20-solid"
            className="w-5 h-5 text-gray-400"
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function CompaniesTab() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeView, setActiveView] = useState("Employees"); // Employees (default), Shift, Leave, Payroll
  const [search, setSearch] = useState("");

  // Data State
  const [companiesList, setCompaniesList] = useState(COMPANY_ONBOARDING);
  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [shiftList, setShiftList] = useState(INITIAL_SHIFTS);
  const [leaveList, setLeaveList] = useState(INITIAL_LEAVES);
  const [payrollList, setPayrollList] = useState(INITIAL_PAYROLLS);

  // Created leave types / pay groups, saved per company name
  const [leaveTypesByCompany, setLeaveTypesByCompany] = useState({});
  const [payGroupsByCompany, setPayGroupsByCompany] = useState({});

  // Which inline form panel is open (null = none)
  const [activeForm, setActiveForm] = useState(null);
  const toggleForm = (name) =>
    setActiveForm((cur) => (cur === name ? null : name));

  // Form States
  const [newCompany, setNewCompany] = useState({
    name: "",
    contact: "",
    email: "",
    plan: "Enterprise",
  });
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "Company Admin",
  });
  const [shiftForm, setShiftForm] = useState({
    shiftName: "",
    timings: "09:00 AM - 06:00 PM",
    days: "Mon - Fri",
  });
  const [allocateShiftForm, setAllocateShiftForm] = useState({
    shiftId: "",
    employeeName: "",
  });
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: "",
    annualQuota: "12",
  });
  const [allocateLeaveForm, setAllocateLeaveForm] = useState({
    employeeName: "",
    leaveType: "Casual Leave",
    days: 1,
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [payGroupForm, setPayGroupForm] = useState({
    groupName: "",
    frequency: "Monthly",
  });
  const [allocatePayrollForm, setAllocatePayrollForm] = useState({
    employeeName: "",
    payGroup: "Engineering Staff",
    month: "October 2026",
    grossSalary: "$4,500",
    deductions: "$350",
  });

  const q = search.toLowerCase();

  // Leave types / pay groups for the company that is currently open
  const companyKey = selectedCompany?.company ?? "";
  const leaveTypes = leaveTypesByCompany[companyKey] ?? DEFAULT_LEAVE_TYPES;
  const payGroups = payGroupsByCompany[companyKey] ?? DEFAULT_PAY_GROUPS;

  const activeCompanies = companiesList
    .filter((c) => c.status === "Active")
    .filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.plan.toLowerCase().includes(q),
    );

  const companyColumns = [
    { label: "Company", key: "company", width: 220, render: companyCell },
    { label: "Contact Person", key: "contact", width: 160 },
    { label: "Plan", key: "plan", width: 110 },
    { label: "Stage", key: "stage", width: 140 },
    { label: "Progress", key: "progress", width: 170, render: progressCell },
    {
      label: "Status",
      key: "status",
      width: 110,
      render: (v) => statusPill(v),
    },
  ];

  const employeeColumns = [
    { label: "Employee", key: "name", width: 180, render: nameCell },
    { label: "Role", key: "role", width: 150 },
    { label: "Email", key: "email", width: 220 },
    { label: "Invited On", key: "invited", width: 110 },
    {
      label: "Status",
      key: "status",
      width: 110,
      render: (v) => statusPill(v),
    },
  ];

  const shiftColumns = [
    { label: "Shift Title", key: "shiftName", width: 170 },
    { label: "Timings", key: "timings", width: 180 },
    { label: "Working Days", key: "days", width: 130 },
    { label: "Assigned To", key: "allocatedTo", width: 210 },
    {
      label: "Status",
      key: "status",
      width: 100,
      render: (v) => statusPill(v),
    },
  ];

  const leaveColumns = [
    { label: "Employee", key: "employee", width: 170 },
    { label: "Leave Type", key: "leaveType", width: 140 },
    { label: "Duration", key: "days", width: 90, render: (v) => `${v} d` },
    { label: "Start Date", key: "startDate", width: 120 },
    { label: "End Date", key: "endDate", width: 120 },
    { label: "Reason", key: "reason", width: 160 },
    {
      label: "Status",
      key: "status",
      width: 100,
      render: (v) => statusPill(v),
    },
  ];

  const payrollColumns = [
    { label: "Employee", key: "employee", width: 170 },
    { label: "Pay Group", key: "payGroup", width: 150 },
    { label: "Month", key: "month", width: 130 },
    { label: "Gross Salary", key: "grossSalary", width: 110 },
    { label: "Deductions", key: "deductions", width: 110 },
    { label: "Net Pay", key: "netPay", width: 110 },
    {
      label: "Status",
      key: "status",
      width: 100,
      render: (v) => statusPill(v),
    },
  ];

  const currentCompanyEmployees = usersList.filter(
    (u) => u.company.toLowerCase() === selectedCompany?.company?.toLowerCase(),
  );

  const filteredEmployees = currentCompanyEmployees.filter(
    (u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  const filteredShifts = shiftList
    .filter(
      (s) =>
        s.company.toLowerCase() === selectedCompany?.company?.toLowerCase(),
    )
    .filter(
      (s) =>
        s.shiftName.toLowerCase().includes(q) ||
        s.allocatedTo.toLowerCase().includes(q),
    );

  const filteredLeaves = leaveList
    .filter(
      (l) =>
        l.company.toLowerCase() === selectedCompany?.company?.toLowerCase(),
    )
    .filter(
      (l) =>
        l.employee.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q),
    );

  const filteredPayrolls = payrollList
    .filter(
      (p) =>
        p.company.toLowerCase() === selectedCompany?.company?.toLowerCase(),
    )
    .filter(
      (p) =>
        p.employee.toLowerCase().includes(q) ||
        p.payGroup.toLowerCase().includes(q) ||
        p.month.toLowerCase().includes(q),
    );

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) return;

    const created = {
      id: Date.now(),
      name: newEmployee.name,
      company: selectedCompany.company,
      role: newEmployee.role,
      email: newEmployee.email,
      invited: "Today",
      status: "Active",
    };

    setUsersList([created, ...usersList]);
    setNewEmployee({ name: "", email: "", role: "Company Admin" });
    setActiveForm(null);
  };

  const handleCreateShift = (e) => {
    e.preventDefault();
    if (!shiftForm.shiftName) return;

    const created = {
      id: Date.now(),
      company: selectedCompany.company,
      shiftName: shiftForm.shiftName,
      timings: shiftForm.timings,
      days: shiftForm.days,
      allocatedTo: "Unallocated",
      status: "Active",
    };
    setShiftList([created, ...shiftList]);
    setShiftForm({
      shiftName: "",
      timings: "09:00 AM - 06:00 PM",
      days: "Mon - Fri",
    });
    setActiveForm(null);
  };

  const handleAllocateShift = (e) => {
    e.preventDefault();
    if (!allocateShiftForm.shiftId || !allocateShiftForm.employeeName) return;

    setShiftList(
      shiftList.map((s) => {
        if (s.id === Number(allocateShiftForm.shiftId)) {
          // Fix: don't add the same employee to a shift twice
          const already =
            s.allocatedTo !== "Unallocated" &&
            s.allocatedTo
              .split(",")
              .map((n) => n.trim())
              .includes(allocateShiftForm.employeeName);
          if (already) return s;

          const prev =
            s.allocatedTo === "Unallocated" ? "" : `${s.allocatedTo}, `;
          return {
            ...s,
            allocatedTo: `${prev}${allocateShiftForm.employeeName}`,
          };
        }
        return s;
      }),
    );
    setAllocateShiftForm({ shiftId: "", employeeName: "" });
    setActiveForm(null);
  };

  const handleCreateLeaveType = (e) => {
    e.preventDefault();
    const name = leaveTypeForm.name.trim();
    if (!name) return;

    // Fix: the new leave type is now saved (it used to be thrown away)
    const exists = leaveTypes.some(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (!exists) {
      setLeaveTypesByCompany({
        ...leaveTypesByCompany,
        [companyKey]: [
          ...leaveTypes,
          { name, quota: Number(leaveTypeForm.annualQuota) || 0 },
        ],
      });
    }
    setActiveForm(null);
    setLeaveTypeForm({ name: "", annualQuota: "12" });
  };

  const handleAllocateLeave = (e) => {
    e.preventDefault();
    if (!allocateLeaveForm.employeeName || !allocateLeaveForm.leaveType) return;

    const created = {
      id: Date.now(),
      company: selectedCompany.company,
      employee: allocateLeaveForm.employeeName,
      leaveType: allocateLeaveForm.leaveType,
      days: allocateLeaveForm.days || 1,
      startDate: allocateLeaveForm.startDate || "Tomorrow",
      endDate: allocateLeaveForm.endDate || "Next Day",
      reason: allocateLeaveForm.reason || "Approved request",
      status: "Approved",
    };
    setLeaveList([created, ...leaveList]);
    setAllocateLeaveForm({
      employeeName: "",
      leaveType: "Casual Leave",
      days: 1,
      startDate: "",
      endDate: "",
      reason: "",
    });
    setActiveForm(null);
  };

  const handleCreatePayGroup = (e) => {
    e.preventDefault();
    const name = payGroupForm.groupName.trim();
    if (!name) return;

    // Fix: the new pay group is now saved (it used to be thrown away)
    const exists = payGroups.some(
      (g) => g.name.toLowerCase() === name.toLowerCase(),
    );
    if (!exists) {
      setPayGroupsByCompany({
        ...payGroupsByCompany,
        [companyKey]: [
          ...payGroups,
          { name, frequency: payGroupForm.frequency },
        ],
      });
    }
    setActiveForm(null);
    setPayGroupForm({ groupName: "", frequency: "Monthly" });
  };

  const handleAllocatePayroll = (e) => {
    e.preventDefault();
    if (!allocatePayrollForm.employeeName) return;

    const grossNum =
      parseFloat(allocatePayrollForm.grossSalary.replace(/[^0-9.-]+/g, "")) ||
      4000;
    const dedNum =
      parseFloat(allocatePayrollForm.deductions.replace(/[^0-9.-]+/g, "")) ||
      300;
    const net = `$${(grossNum - dedNum).toLocaleString()}`;

    const created = {
      id: Date.now(),
      company: selectedCompany.company,
      employee: allocatePayrollForm.employeeName,
      payGroup: allocatePayrollForm.payGroup,
      month: allocatePayrollForm.month,
      grossSalary: allocatePayrollForm.grossSalary,
      deductions: allocatePayrollForm.deductions,
      netPay: net,
      status: "Completed",
    };

    // Fix: allocating the same employee for the same month again now
    // replaces the old row instead of creating a duplicate
    setPayrollList([
      created,
      ...payrollList.filter(
        (p) =>
          !(
            p.company === created.company &&
            p.employee === created.employee &&
            p.month === created.month
          ),
      ),
    ]);
    setAllocatePayrollForm({ ...allocatePayrollForm, employeeName: "" });
    setActiveForm(null);
  };

  const handleOnboardCompany = (e) => {
    e.preventDefault();
    if (!newCompany.name) return;

    const created = {
      id: Date.now(),
      company: newCompany.name,
      contact: newCompany.contact || "Admin",
      plan: newCompany.plan,
      stage: "Live",
      progress: 100,
      status: "Active",
    };

    setCompaniesList([created, ...companiesList]);
    setNewCompany({ name: "", contact: "", email: "", plan: "Enterprise" });
    setActiveForm(null);
  };

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto font-[Poppins]">
      {/* Top Header / Context Navigation Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        {selectedCompany ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCompany(null);
                setActiveForm(null);
                setSearch("");
                setActiveView("Employees");
              }}
              className="p-2 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Back to Active Companies"
            >
              <Icon icon="heroicons:arrow-left-20-solid" className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0">
                {initials(selectedCompany.company)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                    {selectedCompany.company}
                  </h2>
                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {selectedCompany.plan} Plan • Contact:{" "}
                  {selectedCompany.contact}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Active Companies
            </h2>
            <p className="text-[11px] text-gray-500">
              Select any active company to manage employees, shift rosters,
              leaves, and payroll
            </p>
          </div>
        )}

        {/* Header Controls: Search + Tab Switcher (Right side of search) + Specific Action Buttons */}
        <div
          className={`flex flex-wrap items-center gap-2.5 ${
            activeForm ? "hidden" : ""
          }`}
        >
          <SearchBox value={search} onChange={setSearch} />

          {/* INSIDE COMPANY: View Switches on the right side of Search */}
          {selectedCompany && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs">
              {["Employees", "Shift", "Leave", "Payroll"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveView(tab);
                    setActiveForm(null);
                    setSearch("");
                  }}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-all font-medium ${
                    activeView === tab
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* CONTEXT-SPECIFIC ACTION BUTTONS */}
          {selectedCompany ? (
            <>
              {/* EMPLOYEES: Single button */}
              {activeView === "Employees" && (
                <button
                  onClick={() => toggleForm("employee")}
                  className="px-3.5 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap"
                >
                  + Add Employee
                </button>
              )}

              {/* SHIFT: Create and Allocate buttons */}
              {activeView === "Shift" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleForm("createShift")}
                    className="px-3 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap"
                  >
                    + Create Shift
                  </button>
                  <button
                    onClick={() => toggleForm("allocateShift")}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                  >
                    Allocate Shift
                  </button>
                </div>
              )}

              {/* LEAVE: Create and Allocate buttons */}
              {activeView === "Leave" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleForm("createLeave")}
                    className="px-3 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap"
                  >
                    + Create Leave Type
                  </button>
                  <button
                    onClick={() => toggleForm("allocateLeave")}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                  >
                    Allocate Leave
                  </button>
                </div>
              )}

              {/* PAYROLL: Create and Allocate buttons */}
              {activeView === "Payroll" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleForm("createPayGroup")}
                    className="px-3 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap"
                  >
                    + Create Pay Group
                  </button>
                  <button
                    onClick={() => toggleForm("allocatePayroll")}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                  >
                    Allocate Payroll
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => toggleForm("company")}
              className="px-3 sm:px-4 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap"
            >
              + Onboard Company
            </button>
          )}
        </div>
      </div>

      {/* Inline form panels (no popups) */}
      {activeForm === "company" && (
        <InlineForm
          title="Onboard Company"
          submitLabel="Start Onboarding"
          onSubmit={handleOnboardCompany}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Company Name">
            <input
              type="text"
              required
              placeholder="Company name"
              value={newCompany.name}
              onChange={(e) =>
                setNewCompany({ ...newCompany, name: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Contact Person">
            <input
              type="text"
              placeholder="Contact person"
              value={newCompany.contact}
              onChange={(e) =>
                setNewCompany({ ...newCompany, contact: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Contact Email">
            <input
              type="email"
              placeholder="Contact email"
              value={newCompany.email}
              onChange={(e) =>
                setNewCompany({ ...newCompany, email: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Plan">
            <select
              value={newCompany.plan}
              onChange={(e) =>
                setNewCompany({ ...newCompany, plan: e.target.value })
              }
              className={`${inputClass} bg-white`}
            >
              <option>Starter</option>
              <option>Business</option>
              <option>Enterprise</option>
            </select>
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "employee" && (
        <InlineForm
          title={`Add Employee - ${selectedCompany.company}`}
          submitLabel="Add Employee"
          onSubmit={handleAddEmployee}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Full Name">
            <input
              type="text"
              required
              placeholder="e.g. Anand R"
              value={newEmployee.name}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, name: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Work Email">
            <input
              type="email"
              required
              placeholder="e.g. anand@company.com"
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, email: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Designation / Role">
            <select
              value={newEmployee.role}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, role: e.target.value })
              }
              className={`${inputClass} bg-white`}
            >
              <option>Company Admin</option>
              <option>HR Manager</option>
              <option>Operations Manager</option>
              <option>Team Lead</option>
              <option>Software Engineer</option>
              <option>Employee</option>
            </select>
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "createShift" && (
        <InlineForm
          title={`Create Shift - ${selectedCompany.company}`}
          submitLabel="Create Shift"
          onSubmit={handleCreateShift}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Shift Title">
            <input
              type="text"
              required
              placeholder="e.g. Morning Operational Shift"
              value={shiftForm.shiftName}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, shiftName: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Timings">
            <input
              type="text"
              required
              placeholder="09:00 AM - 06:00 PM"
              value={shiftForm.timings}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, timings: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Working Days">
            <select
              value={shiftForm.days}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, days: e.target.value })
              }
              className={`${inputClass} bg-white`}
            >
              <option>Mon - Fri</option>
              <option>Mon - Sat</option>
              <option>Mon - Sun (Rotational)</option>
              <option>Weekend Shift (Sat - Sun)</option>
            </select>
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "allocateShift" && (
        <InlineForm
          title={`Allocate Shift - ${selectedCompany.company}`}
          submitLabel="Allocate Shift"
          onSubmit={handleAllocateShift}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Select Shift">
            <select
              required
              value={allocateShiftForm.shiftId}
              onChange={(e) =>
                setAllocateShiftForm({
                  ...allocateShiftForm,
                  shiftId: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              <option value="">Choose a shift...</option>
              {shiftList
                .filter(
                  (s) =>
                    s.company.toLowerCase() ===
                    selectedCompany.company.toLowerCase(),
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName} ({s.timings})
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Assign Employee">
            <select
              required
              value={allocateShiftForm.employeeName}
              onChange={(e) =>
                setAllocateShiftForm({
                  ...allocateShiftForm,
                  employeeName: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              <option value="">Select an employee...</option>
              {currentCompanyEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "createLeave" && (
        <InlineForm
          title={`Create Leave Type - ${selectedCompany.company}`}
          submitLabel="Save Leave Type"
          onSubmit={handleCreateLeaveType}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Leave Name">
            <input
              type="text"
              required
              placeholder="e.g. Maternity Leave, Bereavement"
              value={leaveTypeForm.name}
              onChange={(e) =>
                setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Annual Quota (Days)">
            <input
              type="number"
              min="1"
              max="90"
              value={leaveTypeForm.annualQuota}
              onChange={(e) =>
                setLeaveTypeForm({
                  ...leaveTypeForm,
                  annualQuota: e.target.value,
                })
              }
              className={inputClass}
            />
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "allocateLeave" && (
        <InlineForm
          title={`Allocate / Grant Leave - ${selectedCompany.company}`}
          submitLabel="Grant Leave"
          onSubmit={handleAllocateLeave}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Employee">
            <select
              required
              value={allocateLeaveForm.employeeName}
              onChange={(e) =>
                setAllocateLeaveForm({
                  ...allocateLeaveForm,
                  employeeName: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              <option value="">Select Employee...</option>
              {currentCompanyEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Leave Type">
            <select
              value={allocateLeaveForm.leaveType}
              onChange={(e) =>
                setAllocateLeaveForm({
                  ...allocateLeaveForm,
                  leaveType: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              {leaveTypes.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Days">
            <input
              type="number"
              min="1"
              value={allocateLeaveForm.days}
              onChange={(e) =>
                setAllocateLeaveForm({
                  ...allocateLeaveForm,
                  days: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Reason / Remark">
            <input
              type="text"
              placeholder="e.g. Approved medical rest"
              value={allocateLeaveForm.reason}
              onChange={(e) =>
                setAllocateLeaveForm({
                  ...allocateLeaveForm,
                  reason: e.target.value,
                })
              }
              className={inputClass}
            />
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "createPayGroup" && (
        <InlineForm
          title={`Create Pay Group - ${selectedCompany.company}`}
          submitLabel="Save Pay Group"
          onSubmit={handleCreatePayGroup}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Pay Group Name">
            <input
              type="text"
              required
              placeholder="e.g. Sales Team Commission, Hourly Staff"
              value={payGroupForm.groupName}
              onChange={(e) =>
                setPayGroupForm({ ...payGroupForm, groupName: e.target.value })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Frequency">
            <select
              value={payGroupForm.frequency}
              onChange={(e) =>
                setPayGroupForm({ ...payGroupForm, frequency: e.target.value })
              }
              className={`${inputClass} bg-white`}
            >
              <option>Monthly</option>
              <option>Bi-Weekly</option>
              <option>Weekly</option>
            </select>
          </FormField>
        </InlineForm>
      )}

      {selectedCompany && activeForm === "allocatePayroll" && (
        <InlineForm
          title={`Allocate Payroll - ${selectedCompany.company}`}
          submitLabel="Run & Allocate Payroll"
          onSubmit={handleAllocatePayroll}
          onClose={() => setActiveForm(null)}
        >
          <FormField label="Employee">
            <select
              required
              value={allocatePayrollForm.employeeName}
              onChange={(e) =>
                setAllocatePayrollForm({
                  ...allocatePayrollForm,
                  employeeName: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              <option value="">Select Employee...</option>
              {currentCompanyEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Pay Group">
            <select
              value={allocatePayrollForm.payGroup}
              onChange={(e) =>
                setAllocatePayrollForm({
                  ...allocatePayrollForm,
                  payGroup: e.target.value,
                })
              }
              className={`${inputClass} bg-white`}
            >
              {payGroups.map((g) => (
                <option key={g.name}>{g.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Gross Salary ($)">
            <input
              type="text"
              value={allocatePayrollForm.grossSalary}
              onChange={(e) =>
                setAllocatePayrollForm({
                  ...allocatePayrollForm,
                  grossSalary: e.target.value,
                })
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="Deductions ($)">
            <input
              type="text"
              value={allocatePayrollForm.deductions}
              onChange={(e) =>
                setAllocatePayrollForm({
                  ...allocatePayrollForm,
                  deductions: e.target.value,
                })
              }
              className={inputClass}
            />
          </FormField>
        </InlineForm>
      )}

      {/* Table is hidden while a form is open */}
      {!activeForm &&
        (selectedCompany ? (
          <div className="flex flex-col gap-4">
            {activeView === "Employees" && (
              <DashboardTable
                columns={employeeColumns}
                data={filteredEmployees}
                rowsPerPage={8}
              />
            )}

            {activeView === "Shift" && (
              <DashboardTable
                columns={shiftColumns}
                data={filteredShifts}
                rowsPerPage={8}
              />
            )}

            {activeView === "Leave" && (
              <DashboardTable
                columns={leaveColumns}
                data={filteredLeaves}
                rowsPerPage={8}
              />
            )}

            {activeView === "Payroll" && (
              <DashboardTable
                columns={payrollColumns}
                data={filteredPayrolls}
                rowsPerPage={8}
              />
            )}
          </div>
        ) : (
          /* Root View: Active Companies list only */
          <DashboardTable
            columns={companyColumns}
            data={activeCompanies}
            rowsPerPage={8}
            onRowClick={(comp) => {
              setSelectedCompany(comp);
              setActiveForm(null);
              setSearch("");
              setActiveView("Employees"); // Employees is default view
            }}
          />
        ))}
    </div>
  );
}

export default CompaniesTab;
