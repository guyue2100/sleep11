
export enum AppState {
  IDLE = 'IDLE',
  FOCUSING = 'FOCUSING',
  VIOLATION = 'VIOLATION',
  COMPLETED = 'COMPLETED'
}

export interface FocusConfig {
  duration: number; // in seconds
  allowEmergencyCall: boolean;
}
