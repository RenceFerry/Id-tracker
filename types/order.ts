export interface IdOrder {
  id: string;
  student_name: string;
  year: string;
  block: string;
  quantity: number;
  paid: boolean;
  date_bought: string; // ISO date, e.g. 2026-09-11
  released: boolean;
  created_at: string;
  idType: 'BSIT' | 'BMMA';
}

export type NewIdOrder = Omit<IdOrder, "id" | "created_at">;
