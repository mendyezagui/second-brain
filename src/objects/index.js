// Object registry — the Salesforce "sObject + fields + layout + list view" metadata.
// One definition per object drives the generic ObjectView (list + record page).
import { Building2, Users, Target, Briefcase, CheckCircle, Award, FileText, CreditCard, Megaphone, Sparkles } from "lucide-react";
import { today, fmt } from "../lib/utils";
import { CONTACT_CATEGORIES, TASK_STATUSES, TASK_CATEGORIES } from "../lib/constants";

const f = (label, type, extra = {}) => ({ label, type, ...extra });

export const OBJECTS = {
  company: {
    name: "company", label: "Company", plural: "Companies", collection: "companies",
    icon: Building2, route: "companies",
    title: (r) => r.name, subtitle: (r) => r.industry, badge: "status",
    fields: {
      name: f("Company Name", "text", { required: true }),
      industry: f("Industry", "text"),
      status: f("Status", "picklist", { options: ["prospect", "customer", "partner", "parked", "churned"] }),
      website: f("Website", "url"),
      linkedin_url: f("LinkedIn", "url", { render: "linkedin" }),
      news_keywords: f("News Keywords", "text", { placeholder: "funding, acquisition" }),
      notes: f("Notes", "textarea"),
      created_at: f("Created", "date", { default: today }),
    },
    list: { search: ["name", "industry"], facets: ["status"], sorts: ["name", "status"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "industry", "status", "website", "linkedin_url", "news_keywords"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
    related: [
      { object: "contact", label: "People", filter: (r, db) => (db.contacts || []).filter((c) => String(c.companyId) === String(r.id) || c.co === r.name) },
      { object: "deal", label: "Deals", filter: (r, db) => (db.deals || []).filter((d) => String(d.companyId) === String(r.id)) },
    ],
    stats: (r, db) => {
      const contacts = (db.contacts || []).filter((c) => String(c.companyId) === String(r.id) || c.co === r.name);
      const deals = (db.deals || []).filter((d) => String(d.companyId) === String(r.id));
      return [
        { label: "Contacts", value: contacts.length, color: "--blue" },
        { label: "Deals", value: deals.length, color: "--amber" },
        { label: "Pipeline", value: fmt(deals.reduce((a, d) => a + (d.value || 0), 0)), color: "--green" },
      ];
    },
  },

  contact: {
    name: "contact", label: "Contact", plural: "Contacts", collection: "contacts",
    icon: Users, route: "crm",
    title: (r) => r.name, subtitle: (r) => [r.role, r.co].filter(Boolean).join(" · "), badge: "status",
    fields: {
      name: f("Name", "text", { required: true }),
      co: f("Company (text)", "text"),
      companyId: f("Company", "lookup", { ref: "company" }),
      role: f("Role", "text"),
      email: f("Email", "email"),
      phone: f("Phone", "text"),
      status: f("Status", "picklist", { options: ["prospect", "customer", "client", "at-risk", "churned"] }),
      category: f("Category", "picklist", { options: CONTACT_CATEGORIES }),
      priority: f("Priority", "picklist", { options: ["Low", "Medium", "High"] }),
      score: f("Score", "score"),
      linkedin_url: f("LinkedIn", "url", { render: "linkedin" }),
      headline: f("Headline", "text"),
      tags: f("Tags", "tags"),
      source: f("Source", "text"),
      campaignId: f("Campaign", "lookup", { ref: "campaign" }),
      referredBy: f("Referred By", "lookup", { ref: "contact" }),
      lastTouch: f("Last Touch", "date"),
      follow_up: f("Follow Up", "text"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["name", "co", "role"], facets: ["status", "category"], sorts: ["name", "score"] },
    layout: { sections: [
      { title: "Identity", cols: 2, fields: ["name", "role", "companyId", "email", "phone", "linkedin_url"] },
      { title: "Status", cols: 2, fields: ["status", "category", "priority", "score", "source", "campaignId"] },
      { title: "Notes", cols: 1, fields: ["headline", "tags", "follow_up", "notes"] },
    ] },
    related: [
      { object: "deal", label: "Deals", filter: (r, db) => (db.deals || []).filter((d) => String(d.contactId) === String(r.id)) },
      { object: "task", label: "Tasks", filter: (r, db) => (db.tasks || []).filter((t) => String(t.contactId) === String(r.id)) },
    ],
  },

  deal: {
    name: "deal", label: "Deal", plural: "Deals", collection: "deals",
    icon: Target, route: "deals",
    title: (r) => r.name, subtitle: (r) => `${r.probability ?? 0}% · ${r.stage || ""}`, badge: "stage",
    fields: {
      name: f("Deal Name", "text", { required: true }),
      companyId: f("Company", "lookup", { ref: "company" }),
      contactId: f("Contact", "lookup", { ref: "contact" }),
      value: f("Value", "currency"),
      stage: f("Stage", "picklist", { options: ["discovery", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] }),
      probability: f("Probability", "percent"),
      closeDate: f("Close Date", "date"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["name"], facets: ["stage"], sorts: ["name", "value"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "value", "stage", "probability", "companyId", "contactId", "closeDate"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
    related: [{ object: "task", label: "Tasks", filter: (r, db) => (db.tasks || []).filter((t) => String(t.dealId) === String(r.id)) }],
  },

  project: {
    name: "project", label: "Project", plural: "Projects", collection: "projects",
    icon: Briefcase, route: "projects",
    title: (r) => r.name, subtitle: (r) => r.client, badge: "status",
    fields: {
      name: f("Project Name", "text", { required: true }),
      client: f("Client", "text"),
      companyId: f("Company", "lookup", { ref: "company" }),
      type: f("Type", "picklist", { options: ["client", "internal"] }),
      status: f("Status", "picklist", { options: ["active", "on_hold", "completed", "cancelled"] }),
      progress: f("Progress", "percent"),
      dueDate: f("Due Date", "date"),
      priority: f("Priority", "picklist", { options: ["low", "medium", "high"] }),
      strategyId: f("Strategy", "lookup", { ref: "strategy" }),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["name", "client"], facets: ["status", "priority"], sorts: ["name", "progress"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "client", "companyId", "type", "status", "priority", "progress", "dueDate", "strategyId"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
    related: [{ object: "task", label: "Tasks", filter: (r, db) => (db.tasks || []).filter((t) => String(t.projectId) === String(r.id)) }],
  },

  task: {
    name: "task", label: "Task", plural: "Tasks", collection: "tasks",
    icon: CheckCircle, route: "tasks",
    title: (r) => r.title, subtitle: (r) => `${r.status || ""}${r.due ? " · due " + r.due : ""}`, badge: "priority",
    fields: {
      title: f("Title", "text", { required: true }),
      status: f("Status", "picklist", { options: TASK_STATUSES }),
      priority: f("Priority", "picklist", { options: ["low", "medium", "high", "critical"] }),
      category: f("Category", "picklist", { options: TASK_CATEGORIES }),
      due: f("Due", "date"),
      done: f("Done", "checkbox"),
      assignedTo: f("Assigned To", "text"),
      projectId: f("Project", "lookup", { ref: "project" }),
      companyId: f("Company", "lookup", { ref: "company" }),
      contactId: f("Contact", "lookup", { ref: "contact" }),
      dealId: f("Deal", "lookup", { ref: "deal" }),
      recurrence: f("Recurrence", "picklist", { options: ["none", "daily", "weekly", "monthly"] }),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["title"], facets: ["status", "priority"], sorts: ["due", "priority"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["title", "status", "priority", "category", "due", "done", "assignedTo", "recurrence"] },
      { title: "Related", cols: 2, fields: ["projectId", "companyId", "contactId", "dealId"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
  },

  goal: {
    name: "goal", label: "Goal", plural: "Goals", collection: "goals",
    icon: Award, route: "goals",
    title: (r) => r.name, subtitle: (r) => `${r.current_value || 0}/${r.target_value || 0} ${r.unit || ""}`, badge: "status",
    fields: {
      name: f("Goal", "text", { required: true }),
      category: f("Category", "picklist", { options: ["professional", "personal", "financial", "health"] }),
      status: f("Status", "picklist", { options: ["active", "paused", "achieved", "dropped"] }),
      target_value: f("Target", "number"),
      current_value: f("Current", "number"),
      unit: f("Unit", "text"),
      period: f("Period", "picklist", { options: ["annual", "quarterly", "monthly"] }),
      start_date: f("Start", "date", { default: today }),
      end_date: f("End", "date"),
      description: f("Description", "textarea"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["name"], facets: ["status", "category"], sorts: ["name"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "category", "status", "period", "target_value", "current_value", "unit", "start_date", "end_date"] },
      { title: "Notes", cols: 1, fields: ["description", "notes"] },
    ] },
  },

  strategy: {
    name: "strategy", label: "Strategy", plural: "Strategies", collection: "strategies",
    icon: Target, route: "strategies",
    title: (r) => r.name, subtitle: (r) => r.status, badge: "priority",
    fields: {
      name: f("Strategy", "text", { required: true }),
      goalId: f("Goal", "lookup", { ref: "goal" }),
      status: f("Status", "picklist", { options: ["active", "paused", "done"] }),
      priority: f("Priority", "picklist", { options: ["low", "medium", "high"] }),
      description: f("Description", "textarea"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["name"], facets: ["status", "priority"], sorts: ["name"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "goalId", "status", "priority"] },
      { title: "Notes", cols: 1, fields: ["description", "notes"] },
    ] },
    related: [{ object: "project", label: "Projects", filter: (r, db) => (db.projects || []).filter((p) => String(p.strategyId) === String(r.id)) }],
  },

  invoice: {
    name: "invoice", label: "Invoice", plural: "Invoices", collection: "invoices",
    icon: FileText, route: "invoices",
    title: (r) => r.number || r.client || `Invoice #${r.id}`, subtitle: (r) => r.client, badge: "status",
    fields: {
      number: f("Number", "text"),
      client: f("Client", "text"),
      amount: f("Amount", "currency"),
      status: f("Status", "picklist", { options: ["draft", "sent", "paid", "overdue"] }),
      issued: f("Issued", "date"),
      due: f("Due", "date"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["number", "client"], facets: ["status"], sorts: ["due", "amount"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["number", "client", "amount", "status", "issued", "due"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
    related: [{ object: "payment", label: "Payments", filter: (r, db) => (db.payments || []).filter((p) => String(p.invoice_id) === String(r.id)) }],
  },

  payment: {
    name: "payment", label: "Payment", plural: "Payments", collection: "payments",
    icon: CreditCard, route: "payments",
    title: (r) => `${r.date || "Payment"} · ${fmt(r.amount || 0)}`, subtitle: (r) => r.payer, badge: "method",
    fields: {
      amount: f("Amount", "currency"),
      date: f("Date", "date", { default: today }),
      payer: f("Payer", "text"),
      payer_type: f("Payer Type", "picklist", { options: ["company", "contact"] }),
      method: f("Method", "picklist", { options: ["check", "card", "wire", "cash", "ach"] }),
      reference: f("Reference", "text"),
      notes: f("Notes", "textarea"),
    },
    list: { search: ["payer", "reference"], facets: ["method"], sorts: ["date", "amount"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["amount", "date", "payer", "payer_type", "method", "reference"] },
      { title: "Notes", cols: 1, fields: ["notes"] },
    ] },
  },

  campaign: {
    name: "campaign", label: "Campaign", plural: "Campaigns", collection: "campaigns",
    icon: Megaphone, route: "marketing",
    title: (r) => r.name, subtitle: (r) => r.type, badge: "status",
    fields: {
      name: f("Campaign", "text", { required: true }),
      type: f("Type", "picklist", { options: ["Email", "Social", "Event", "Webinar", "Ads"] }),
      status: f("Status", "picklist", { options: ["draft", "active", "paused", "completed"] }),
      leads: f("Leads", "number"),
      opens: f("Opens", "number"),
      conversions: f("Conversions", "number"),
      startDate: f("Start Date", "date"),
    },
    list: { search: ["name"], facets: ["status", "type"], sorts: ["name"] },
    layout: { sections: [
      { title: "Details", cols: 2, fields: ["name", "type", "status", "startDate", "leads", "opens", "conversions"] },
    ] },
  },

  ai_memory: {
    name: "ai_memory", label: "AI Memory", plural: "AI Memories", collection: "ai_memories",
    icon: Sparkles, route: "ai_memories",
    title: (r) => r.subject || r.memory_summary || `Memory #${r.id}`, subtitle: (r) => r.memory_type, badge: "memory_type",
    fields: {
      subject: f("Subject", "text", { required: true }),
      memory_type: f("Type", "picklist", { options: ["general", "preference", "fact", "decision"] }),
      ai_system: f("AI System", "picklist", { options: ["claude", "gpt", "gemini"] }),
      memory_summary: f("Summary", "textarea"),
      source_context: f("Source", "text"),
      companyId: f("Company", "lookup", { ref: "company" }),
      contactId: f("Contact", "lookup", { ref: "contact" }),
      dealId: f("Deal", "lookup", { ref: "deal" }),
      projectId: f("Project", "lookup", { ref: "project" }),
    },
    list: { search: ["subject", "memory_summary"], facets: ["memory_type"], sorts: ["subject"] },
    layout: { sections: [
      { title: "Memory", cols: 2, fields: ["subject", "memory_type", "ai_system", "source_context"] },
      { title: "Content", cols: 1, fields: ["memory_summary"] },
      { title: "Links", cols: 2, fields: ["companyId", "contactId", "dealId", "projectId"] },
    ] },
  },
};

// route id (nav) -> object name
export const OBJECT_BY_ROUTE = Object.fromEntries(Object.values(OBJECTS).map((o) => [o.route, o.name]));
// record type -> object name (type === object name here)
export const objectFor = (name) => OBJECTS[name];
