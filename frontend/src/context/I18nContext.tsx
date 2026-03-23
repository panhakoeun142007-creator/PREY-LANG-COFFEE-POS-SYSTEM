import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "km";

type Dictionary = Record<string, string>;

const STORAGE_KEY = "prey-lang-pos:language";

const DICTS: Record<Language, Dictionary> = {
  en: {
    "lang.english": "English",
    "lang.khmer": "Khmer",
    "nav.language": "Language",
    "nav.notifications": "Notifications",
    "nav.account": "Account",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "role.admin": "Admin",
    "role.staff": "Staff",
    "hint.assigned_by_admin": "Assigned by admin",

    "nav.dashboard": "Dashboard",
    "nav.live_orders": "Live Orders",
    "nav.order_history": "Order History",
    "nav.receipts": "Receipts",
    "nav.products": "Products",
    "nav.categories": "Categories",
    "nav.tables": "Table Management",
    "nav.stock": "Ingredients / Stock",
    "nav.finance": "Income & Expenses",
    "nav.analytics": "Sales Analytics",
    "nav.staff_management": "Staff Management",

    "group.dashboard": "Dashboard",
    "group.orders": "Orders",
    "group.receipts": "Receipts",
    "group.menu_management": "Menu Management",
    "group.tables": "Tables",
    "group.stock_recipe": "Stock & Recipe",
    "group.finance": "Finance",
    "group.analytics": "Analytics",
    "group.system": "System",

    "customer.search_placeholder": "Search for your favorite brew...",
    "customer.pick_heading": "Coffee your Selection",
    "customer.popular_products": "Popular products",
    "customer.location": "Prey Lang Coffee - Phnom Penh",

    "field.name": "Name",
    "field.email": "Email",
    "field.role": "Role",
    "btn.cancel": "Cancel",
    "btn.save": "Save",
    "btn.saving": "Saving...",
    "btn.remove_photo": "Remove photo",
    "msg.no_notifications": "No notifications",
    "account.desc_name_image_only": "You can update your name and profile image. Email and password are assigned by admin.",
  },
  km: {
    "lang.english": "អង់គ្លេស",
    "lang.khmer": "ខ្មែរ",
    "nav.language": "ភាសា",
    "nav.notifications": "ការជូនដំណឹង",
    "nav.account": "គណនី",
    "nav.settings": "ការកំណត់",
    "nav.logout": "ចាកចេញ",
    "role.admin": "អ្នកគ្រប់គ្រង",
    "role.staff": "បុគ្គលិក",
    "hint.assigned_by_admin": "កំណត់ដោយអ្នកគ្រប់គ្រង",

    "nav.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "nav.live_orders": "បញ្ជាទិញកំពុងដំណើរការ",
    "nav.order_history": "ប្រវត្តិបញ្ជាទិញ",
    "nav.receipts": "វិក្កយបត្រ",
    "nav.products": "ផលិតផល",
    "nav.categories": "ប្រភេទ",
    "nav.tables": "គ្រប់គ្រងតុ",
    "nav.stock": "គ្រឿងផ្សំ / ស្តុក",
    "nav.finance": "ចំណូល និង ចំណាយ",
    "nav.analytics": "វិភាគការលក់",
    "nav.staff_management": "គ្រប់គ្រងបុគ្គលិក",

    "group.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "group.orders": "បញ្ជាទិញ",
    "group.receipts": "វិក្កយបត្រ",
    "group.menu_management": "គ្រប់គ្រងម៉ឺនុយ",
    "group.tables": "តុ",
    "group.stock_recipe": "ស្តុក និង រូបមន្ត",
    "group.finance": "ហិរញ្ញវត្ថុ",
    "group.analytics": "វិភាគ",
    "group.system": "ប្រព័ន្ធ",

    "customer.search_placeholder": "ស្វែងរកកាហ្វេដែលអ្នកចូលចិត្ត...",
    "customer.pick_heading": "ជ្រើសរើសកាហ្វេ",
    "customer.popular_products": "ផលិតផលពេញនិយម",
    "customer.location": "Prey Lang Coffee - ភ្នំពេញ",

    "field.name": "ឈ្មោះ",
    "field.email": "អ៊ីមែល",
    "field.role": "តួនាទី",
    "btn.cancel": "បោះបង់",
    "btn.save": "រក្សាទុក",
    "btn.saving": "កំពុងរក្សាទុក...",
    "btn.remove_photo": "លុបរូបភាព",
    "msg.no_notifications": "គ្មានការជូនដំណឹង",
    "account.desc_name_image_only": "អ្នកអាចកែប្រែបានតែឈ្មោះ និង រូបភាពប្រវត្តិរូប។ អ៊ីមែល និង ពាក្យសម្ងាត់ត្រូវបានកំណត់ដោយអ្នកគ្រប់គ្រង។",
  },
};

function detectDefaultLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "km") return stored;
  const navLang = (navigator.language || "").toLowerCase();
  if (navLang.startsWith("km") || navLang.startsWith("kh")) return "km";
  return "en";
}

type I18nValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => detectDefaultLanguage());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = DICTS[lang];
      return dict[key] ?? DICTS.en[key] ?? key;
    },
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
