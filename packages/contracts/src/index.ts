export type TenantId = string;

export interface Organization {
  id: string;
  name: string;
}

export interface ApiHealth {
  status: "ok";
  service: string;
}