export interface FilterType {
  date?: {
    op?: 'LT' | 'GT' | 'EQ';
    value?: string;
  };
  type?: 'BSIT' | 'BMMA';
  paid?: boolean;
  released?: boolean;
}

export type FilterParams = Omit<FilterType, 'date'> & {
  op?: 'LT' | 'GT' | 'EQ';
  value?: string;
}