import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureSettings, SETTINGS_ID, type Settings } from "../lib/db";

const DEFAULT_SETTINGS: Settings = { id: SETTINGS_ID, numeralStyle: "bn" };

export function useSettings(): { settings: Settings; setNumeralStyle: (style: "bn" | "en") => void } {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), []);

  const setNumeralStyle = (numeralStyle: "bn" | "en") => {
    void ensureSettings().then((current) => db.settings.put({ ...current, numeralStyle }));
  };

  return { settings: settings ?? DEFAULT_SETTINGS, setNumeralStyle };
}
