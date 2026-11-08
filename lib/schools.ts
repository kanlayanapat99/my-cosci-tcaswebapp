// lib/schools.ts
// ชนิดข้อมูล + ค่าคงที่ของส่วน "โรงเรียน"
// ข้อมูลจริงอยู่ในฐานข้อมูล (ดู sql/schools.sql และ /api/tcas/schools)

export const TCAS_ROUNDS = [
  { value: "tcas_1", label: "TCAS 1", color: "#3b82f6" },
  { value: "tcas_2", label: "TCAS 2", color: "#10b981" },
  { value: "tcas_3", label: "TCAS 3", color: "#f59e0b" },
  { value: "tcas_4", label: "TCAS 4", color: "#8b5cf6" },
] as const;

export type ApiMajor = { code: string; name: string };
export type ApiSource = { id: number; round: number; year: string; label: string };
export type ApiApplicant = { source_id: number; round: number; year: string; name: string; applicants: number };
export type ApiRank = { source_id: number; round: number; major_code: string; name: string; rank_order: number };
export type SchoolsPayload = {
  majors: ApiMajor[];
  sources: ApiSource[];
  applicants: ApiApplicant[];
  ranks: ApiRank[];
};

// จัดกลุ่มวิชาเอกตามตัวอักษรหน้ารหัส (C01.., I01.., M01..)
export const MAJOR_GROUPS = [
  { prefix: "C", name: "กลุ่มสาขาภาพยนตร์และสื่อดิจิทัล" },
  { prefix: "I", name: "กลุ่มสาขาวิชานวัตกรรมสื่อสารสังคม" },
  { prefix: "M", name: "กลุ่มสาขานวัตกรรมการสื่อสาร" },
] as const;

export const formatSource = (s: ApiSource) => `TCAS ${s.label} ปีการศึกษา ${s.year}`;
