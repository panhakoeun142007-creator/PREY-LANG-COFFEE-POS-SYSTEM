import { Languages } from "lucide-react";
import { useI18n, type Language } from "../context/I18nContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Props = {
  className?: string;
};

export default function LanguageSwitcher({ className }: Props) {
  const { lang, setLang, t } = useI18n();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Language)}>
      <SelectTrigger className={className}>
        <Languages className="h-4 w-4" />
        <SelectValue placeholder={t("nav.language")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("lang.english")}</SelectItem>
        <SelectItem value="km">{t("lang.khmer")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

