export interface SlotResult {
  available: boolean;
  reason?: string;
  slotDuration?: number;
  slots: { time: string; available: boolean; spotsLeft: number }[];
}
