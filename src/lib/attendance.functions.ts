import { createServerFn } from "@tanstack/react-start";

export type AttendanceRow = {
  id: string;
  team: string;
  total: number;
  average: number;
};

export const getAttendance = createServerFn({ method: "GET" }).handler(
  async (): Promise<AttendanceRow[]> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return [];
    const res = await fetch(`${url}/rest/v1/attendance?select=*&order=total.desc&limit=50`, {
      headers: { apikey: key },
    });
    if (!res.ok) return [];
    return (await res.json()) as AttendanceRow[];
  },
);
