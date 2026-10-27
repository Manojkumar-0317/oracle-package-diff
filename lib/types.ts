export interface PackageSummary {
  name: string;
  hasSpec: boolean;
  hasBody: boolean;
}

export interface PackageSource {
  name: string;
  specSource: string | null;
  bodySource: string | null;
}

export interface ParsedOracleConnection {
  user: string;
  password: string;
  connectString: string;
}
