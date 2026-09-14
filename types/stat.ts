export interface Stats {
    totalIDs: number;
    paid: number;
    unpaid: number;
    released: number;
    pendingPayment: number;
    collected: number;
    typeCount: {
        IT: number;
        MA: number;
    };
    totalPayment: number;
}