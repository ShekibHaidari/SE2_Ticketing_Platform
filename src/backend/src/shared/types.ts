export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type PlaceholderMessage = {
  module: string;
  message: string;
  nextStep?: string;
};
